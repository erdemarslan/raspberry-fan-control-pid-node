const Controller = require('node-pid-controller');
const fs =  require("fs");
const Gpio = require('pigpio').Gpio;
const fan = new Gpio(13, {mode: Gpio.OUTPUT});

// Set Fan
fan.pwmFrequency(1);
let fanSpeed = 0; // 0 - 255
fan.pwmWrite(fanSpeed);

let setFanSpeed = function(input) {
	// fan run speed 155 - 255
	let value = Math.round(input);
	// set value between -1 and -20 (1-100)
	value = value < -20 ? -20 : value;
	value = value >= 0 ? 0 : value;
	// set value to positive
	value *= -1;

	let actualFanSpeed = 155 + (value * 5);
	actualFanSpeed = actualFanSpeed > 255 ? 255 : actualFanSpeed;
	console.log("Current Fan Speed: %" + value * 5);
	fan.pwmWrite(actualFanSpeed);
};

// Set PID Controller 
let pid = new Controller({
  k_p: 1.854,
  k_i: 0.021,
  k_d: 0.389,
  dt: 1
});

// Set Temperature Value
pid.setTarget(40);

let runNum = 0;
let sumValues = 0;

setInterval(function() {
	if (runNum < 10) {
		let readTemp = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp");
		let temp = readTemp/1000;
		console.log("Sıcaklık: " + temp);
		sumValues += temp;
		runNum += 1;
	} else {
		let input = pid.update(sumValues / 10);
		setFanSpeed(input);
		console.log("PID Hata Değeri: " + input);
		console.log("Sum Values: " + sumValues/10);
		sumValues = 0;
		runNum = 0;
	}
}, 100);