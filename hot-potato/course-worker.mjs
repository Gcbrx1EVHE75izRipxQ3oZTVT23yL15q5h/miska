import {buildCourse} from './engine.mjs';
self.onmessage=({data})=>{try{self.postMessage({course:buildCourse(data.count,data.course)})}catch(error){self.postMessage({error:String(error)})}};
