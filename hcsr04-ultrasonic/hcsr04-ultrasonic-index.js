/**
  * SAP Cloud Platform iOT service usage with Tessel 2.0
    * This code will be on reading data from ultrasonic proximity sensor HCSR04
    * and send it to SCP via SCP iOT service.

  * Tessel 2.0 ile SAP Cloud Platform iOT servisinin kullanımı
    * Bu uygulama ultarsonik HCSR04 ses sensörüyle mesafe bilgisini alıp
    * SCP iOT servisi aracılığıyla SCP'a ilgili sensör verilerini göndermektedir.

  * Release version 1.0 at 25.04.2017
  * @author Barış Arslan   || xbarslan on @github || barisarslan8@gmail.com
  * @author Gürkan Akpınar || 4RaymonD on @github || gurkanakpinar.35@gmail.com
*/

// Tessel
const tessel = require('tessel');

// Connect to SAP iot service parameters
// SAP iot servisi için bağlantı parametreleri

// Connection variables
// Bağlantı için değişkenler
var hostIoT = 'iotmmsPxxxxxxxxxxxtrial.hanatrial.ondemand.com';

// SAP Cloud Platform port
// SAP Cloud Platformu için bağlantı portu
var portIoT = 443;

// iOT service path
// iOT servisinin yarattığı uygulamanın API yolu
var pathIoT = '/com.sap.iotservices.mms/v1/api/http/data/';

// Device oAuth Token
// iOT cihazının yetkilendime için kullanılan anahtarı
var authStrIoT = 'Bearer xxxxxxxxxxxxxxxxxxxxxxxx';

// Device ID
// iOT cihazına SCP tarafında verilen ID
var deviceId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx';

// Message type ID
// Verileri SCP'a göndermek için kullanacağımız mesaj tipi
var messageTypeID = 'xxxxxxxxxxxxxxxxxxxxx';

// Slave address 0x27 which is A4 pin on arduino nano
// You can use datasheet to see address
// Arduino nano datasheet : https://www.arduino.cc/en/uploads/Main/ArduinoNanoManual23.pdf

// Arduino nano üzerindeki slave adresi 0x27, A4 pin'i olarak geçmektedir.
// Pinlerin karşılığını arduino nano datasheet'inde bulabilirsiniz.
// Arduino nano datasheet : https://www.arduino.cc/en/uploads/Main/ArduinoNanoManual23.pdf
const hcsr04 = new tessel.port.A.I2C(0x27);

function sendToSCP(distance, temperature) {
    // HTTP request
    var http = require('https');

    // HTTP request connection information
    // We will post the sensor data to SAP Cloud Platform

    // HTTP request bağlantı bilgileri
    // Sensör verilerini POST metodu ile SAP Cloud Platformuna göndereceğiz
    var options = {
        host: hostIoT,
        port: portIoT,
        path: pathIoT + deviceId,
        agent: false,
        headers: {
            'Authorization': authStrIoT,
            'Content-Type': 'application/json;charset=utf-8'
        },
        method: 'POST',
    };

    // HTTP request response details
    // HTTP request'inden dönen cevabın detayları
    options.agent = new http.Agent(options);
    callback = function (response) {
        var body = '';
        response.on('data', function (data) {
            body += data;
        });
        response.on('end', function () {
            console.log("END:", response.statusCode, JSON.parse(body).msg);
        });
        response.on('error', function (e) {
            console.error(e);
        });
    }
    var req = http.request(options, callback);
    req.on('error', function (e) {
        console.error(e);
    });
    req.shouldKeepAlive = false;

    // Data that we want to send to SAP Cloud Platform
    // Data will be json format

    // SAP Cloud Platforma göndereceğimiz veri
    // Veriler JSON formatında gönderilir
    var jsonData = {
        "mode": "sync",
        "messageType": messageTypeID,
        "messages": [{
            "temperature": temperature,
            "distance": distance
        }]
    }

    // Write JSON data to console and http request
    // JSON formatındaki veriyi hem console üzerine hem de http request'in kendisine yazıyoruz
    var strData = JSON.stringify(jsonData);
    console.log("POST jsonData:" + strData);

    req.write(strData);
    req.end();
}

function getDistance(distance) {
    hcsr04.read(2, (error, data) => {
        if (error) {
            return;
        }
        // HCSR04 firmware writes data as two bytes
        // HCSR04 firmware veriyi bize iki bit olarak göndermektedir
        var usec = data.readUInt16BE();

        // Convert usec to cm
        // Sensorden gelen veriyi cm'e çeviriyoruz
        distance(usec / 29.1 / 2);
    });
}

function start() {
    // Application start function
    // Uygulamanın başlangıç metodu

    // Get distance (Proximity)
    // Sensorden uzaklık bilgisi alınır
    getDistance(distance => {
        console.log(distance);

        // Send data to SAP Cloud Platform
        // Sensor verileri SAP Cloud Platforma gönderilir
        sendToSCP(distance, 24);
    });
}

// One second interval to send sensor data to SAPCP
// Her saniye sensördeki veriyi SAPCP a gönderiyoruz
setInterval(start, 1000);
