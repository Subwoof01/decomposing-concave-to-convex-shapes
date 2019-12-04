// It is best not to touch this file. 
// All it does is create a GameApp object 
// and binds it to the window at the correct size.

// Use `npm run dev` to compile and run a debugging build.
// Use `npm run build` to compile and run a release build.

import {GameApp} from "./app/app";

const myGame = new GameApp(document.body,  window.innerWidth, window.innerHeight);

console.log(`Setting window size to: `, window.innerWidth, window.innerHeight);
