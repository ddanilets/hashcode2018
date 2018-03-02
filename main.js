import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.appendFile);


class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}


export default async function main() {
  const dataSet = (await readFile('b_should_be_easy.in')).toString().match(/(\d| )*\n/g);

  const config = dataSet[0].replace('\n', '').split(' ').map(el => parseInt(el));

  const data = {
    rows: config[0],
    columns: config[1],
    vehicles: config[2],
    rides: config[3],
    bonus: config[4],
    time: config[5],
  };

  let trips = [];
  dataSet.shift();

  dataSet.forEach(el => {
    const m = el.replace('\n').split(' ').map(el => parseInt(el));
    trips.push({
      start: new Point(m[0], m[1]),
      end: new Point(m[2], m[3]),
      startTime: m[4],
      endTime: m[5],
      finished: false,
      started: false,
    });
  });

  trips = trips.map((el, key) => {
    return {
      ...el,
      key,
    };
  });

  const vehicles = [];
  
  for (let i = 0; i < data.vehicles; i++) {
    vehicles.push({
      position: new Point(0, 0),
      isBusy: false,
      trips: [],
      releaseTime: null,
    });
  }



  for(let i = 0; i < data.time; i++) {
    vehicles.forEach(el => {
      if (el.releaseTime && i >= el.releaseTime) {
        el.releaseTime = null;
        el.isBusy = false;
      }
    });
    trips.forEach(el => {
      if (el.endedTime && el.endedTime <= i) {
        el.finished = true;
      }
    });
    console.log(`${i / data.time * 100} %`);
    while (areVehiclesAvailable(vehicles, i) && trips.filter(el => !el.started && el.endTime > i).length > 0) {
      const workingTrips = trips.filter(el => !el.started && el.endTime > i);
      // console.log(workingTrips);
      // console.log(trips);
      // console.log(workingTrips.length, i);
      const nextTrip = sortTripsByRelevance(workingTrips, i)[0];
      const vehicle = vehicles[getClosestAvailableVehicle(vehicles, nextTrip.start, i).key];
      const trip = trips[nextTrip.key];
      vehicle.trips.push(trip.key);
      vehicle.isBusy = true;
      trip.started = true;
      trip.startedTime = i + getDistance(vehicle.position, trip.start);
      trip.endedTime = trip.startedTime + getDistance(trip.start, trip.end);
      vehicle.releaseTime = trip.endedTime;
      vehicle.position = trip.end;
    }
  }
  vehicles.forEach((el) => {
    fs.appendFileSync('b.out', el.trips.length.toString() + ' ' + el.trips.join(' '));
    fs.appendFileSync('b.out', '\n');
  });
}


function findNextTrips(trip) {
  if (trip.finished || trip.started) {
    return false;
  }
  return true;
}

function areVehiclesAvailable(vehicles, time) {
  return vehicles.filter(el => !el.isBusy && time >= el.releaseTime).length > 0;
}

function getClosestAvailableVehicle(vehicles, position, time) {
  const workingVehicles = vehicles.map((el, key) => {
    return {
      ...el,
      key
    };
  }).filter(el => !el.isBusy && time >= el.releaseTime).map((el, key) => {
    const distance = getDistance(el.position, position);
    return {
      ...el,
      distance,
    };
  });
  return workingVehicles.sort((a, b) => {
    if (a.distance > b.distance) {
      return 1;
    }
    return -1;
  })[0];
}

function sortTripsByRelevance(trips, time) {
  return trips.sort((a, b) => {
    if (getDistance(a.start, a.end) + a.startTime < time ? a.bonus : 0 > getDistance(b.start, b.end) + + b.startTime < time ? b.bonus : 0) {
      return 1;
    }
    return -1;
  });
}

function getDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}