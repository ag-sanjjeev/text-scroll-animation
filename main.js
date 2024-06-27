/*
  ______________________________________________________________________________________________
 |                                                                                              |
 |  Copyright 2024 ag-sanjjeev                                                                  |
 |                                                                                              |
 |  The source code is licensed under MIT-style License.                                        |
 |  The usage, permission and condition are applicable to this source code as per license.      |
 |  That can be found in LICENSE file or at https://opensource.org/licenses/MIT.                |
 |______________________________________________________________________________________________|

*/

/*================*/
/* text scroll js */
/*================*/

/* global constants */
const inputText = document.getElementById('inputText');
const canvasWidth = document.getElementById('canvasWidth');
const canvasHeight = document.getElementById('canvasHeight');
const fontSize = document.getElementById('fontSize');
const scrollSpeed = document.getElementById('scrollSpeed');
const paddingX = document.getElementById('paddingX');
const paddingY = document.getElementById('paddingY');
const lineHeight = document.getElementById('lineHeight');
const fps = document.getElementById('fps');
const backgroundColor = document.getElementById('backgroundColor');
const textColor = document.getElementById('textColor');
const textFontFamily = document.getElementById('textFontFamily');
const setFontButton = document.getElementById('setFontButton');
const fontStyle = document.getElementById('fontStyle');
const textAlignment = document.getElementById('textAlignment');

const playButton = document.getElementById('playButton');
const previewDownloadButton = document.getElementById('previewDownloadButton');

const canvas = document.getElementById('canvas1'); 
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth / 5;
canvas.height = window.innerHeight / 2;
canvas.style.backgroundColor = backgroundColor.value; 

// Initially set recorder state to null 
let recorderState = null;

/* class ScrollText */
class ScrollText {
	// private property
	#totalTextHeight = 0;
	#wrappedText;

	// constructor method
	constructor (inputText) {
		this.inputText = inputText.split('\n');
		this.fontSize = fontSize.value;
		this.scrollSpeed = scrollSpeed.value;
		this.backgroundColor = backgroundColor.value;
		this.textColor = textColor.value;
		this.paddingX = paddingX.value;
		this.paddingY = paddingY.value;
		this.lineHeight = lineHeight.value;
		this.fontFamily = textFontFamily.value;
		this.fontStyle = fontStyle.value;
		this.textAlignment = textAlignment.value;

		this.interval = 1000/fps.value;
		this.timer = 0;

		this.recorderState = 'initialized';
		this.recorder = null;
		this.animationFrameReference = null;

		canvas.width = canvasWidth.value;
		canvas.height = canvasHeight.value;
		canvas.style.backgroundColor = this.backgroundColor;
		this.x = this.paddingX / 2;
		this.y = 0;	
		this.wrapText();	
		this.calcTotalTextHeight();
		this.currentY = canvas.height;
	}
	// scroll method
	scroll(timeStamp) {				
		
		// setting default font if it is an empty
		if (this.fontFamily == null || this.fontFamily == undefined) { this.fontFamily = 'Ysabeau Infant'; }

		// clear everything in canvas before start next frame
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// fill background
		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);	

		let textFontStyle = this.fontStyle.replaceAll('underline', '').trim();
		// setting font style
		ctx.font = `${this.fontStyle} ${this.fontSize}px ${this.fontFamily}, san-serif`;	
		
		// setting initial y co-ordinate to be height of canvas			
		this.y = this.currentY;
		
		// iterate through rearranged wrapped text for given details
		for (const line of this.#wrappedText) {

			// line length
			let underlineLength = 0;
			// scrolling text fill
			ctx.fillStyle = this.textColor;
			ctx.fillText(line, this.x, this.y);
			
			// applying underline font style
			if (this.fontStyle.indexOf('underline') !== -1) {
				underlineLength = ctx.measureText(line);
				ctx.fillStyle = this.textColor;
				ctx.fillRect(this.x, Number(this.y) + 15, underlineLength.width, 2);	
				// reusing underlineLength as underline height
				underlineLength = 17;
			}
			// increasing the y co-ordinate to move next line to visible area of canvas
			this.y += Number(this.fontSize) + Number(this.lineHeight) + Number(underlineLength);
			
			// filling padding vertical area
			ctx.fillStyle = this.backgroundColor;
			ctx.fillRect(0, 0, canvas.width, this.paddingY/2);
			ctx.fillRect(0, canvas.height - this.paddingY/2, canvas.width, this.paddingY/2);

		}

		// updating current y co-ordinate value 
		this.currentY -= this.scrollSpeed;

		// reset y co-ordinate to animate again
		if (Number(this.currentY) + Number(this.totalTextHeight) + Number(this.paddingY) < 0 ) {
			this.currentY = canvas.height;

			// if this scroll animation request by recorder event then need to stop after completing animation
			if (this.recorder != null) {				
				this.recorder.stop();
				setTimeout(this.stopAnimation.bind(this), 1000);
			}
		}

		// saving animation reference to stop or cancelAnimationFrame
		this.animationFrameReference = window.requestAnimationFrame(this.scroll.bind(this));
	}
	// stopAnimation method
	stopAnimation () {
		// canceling or stopping animation
		window.cancelAnimationFrame(this.animationFrameReference);
	}	
	// calcTotalTextHeight method
	calcTotalTextHeight() {
		// calculating total height that going to occupy by processed text
		this.totalTextHeight = Number(this.paddingY);
		for (const line of this.#wrappedText) {
			this.totalTextHeight += Number(this.fontSize) + Number(this.lineHeight);
		}
	}
	// wrapText method
	wrapText() {
		// getting input text split by new lines
		let lines = this.inputText;

		let textFontStyle = this.fontStyle.replaceAll('underline', '').trim();
		
		// assigning font style to calculate total width and height taken in the canvas
		// ctx.font = `${this.fontSize}px ${this.fontFamily}, san-serif`;
		ctx.font = `${textFontStyle} ${this.fontSize}px ${this.fontFamily}, san-serif`;
		
		// created empty lines array to store new lines
		let tempLines = [];

		// iterate through all lines of text that given
		for (const line of lines) {
			// split by space that consider as words
			const words = line.split(' ');

			// initialize empty current line array for each iteration
			let currentLine = [];

			// iterate through each word in the line
			for (const word of words) {
				// measuring text metrics inside canvas
				const metrics = ctx.measureText(currentLine.join(' ') + word + ' ');
				// calculating line width taken inclusive of padding in horizontal
				const lineWidth = Number(metrics.width) + Number(this.paddingX);
				
				// if lines width is more than the allotted width then it will be a new line
				if (lineWidth >= (canvas.width - this.paddingX)) {
					
					tempLines.push(currentLine.join(' '));
					currentLine = [];
				}

				// pushing last line
				currentLine.push(word);
			}

			// pushing all new processed lines into temp lines		
			tempLines.push(currentLine.join(' '));
		}

		// setting into class properties for animation
		this.#wrappedText = tempLines;

	}
}


/* class preference */
class PreferenceHandler {
	// constructor method
	constructor () {		
		this.isAnimationPlaying = false;
		this.object = null;
		this.fontFamily = null;
	}

	// setAnimationObject method
	setAnimationObject(object) {
		// setting animation object for further reference
		this.object = object;		
	}

	// getAnimationState method
	getAnimationState() {
		// which returns true or false set to this class properties
		return this.isAnimationPlaying;
	}

	// getAnimationObject method
	getAnimationObject() {
		// which returns animation class object
		return this.object;
	}
}

// initializing PreferenceHandler class object
const preferenceObj = new PreferenceHandler();

setFontButton.addEventListener('click', function() {
  let fontFamily = textFontFamily.value.trim();

  // Basic validation (optional)
  if (!fontFamily) {
    return; // Handle empty input
  }

  // Construct the Google Fonts URL based on user input
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replaceAll(' ', '+')}:wght@300;400;700&display=swap`;

  const canvasFontLink = document.getElementById('canvasFontLink');

  if (canvasFontLink == null || canvasFontLink == undefined) {
	  // Create a new link element dynamically
	  const link = document.createElement('link');
	  link.href = fontUrl;
	  link.id = 'canvasFontLink';
	  link.rel = 'stylesheet';
	  link.media = 'all';

	  // Inject the link into the head of the document
	  document.head.appendChild(link);
  } else {
  	canvasFontLink.href = fontUrl;
  }

  preferenceObj.fontFamily = fontFamily;

});

/* play button event listener */
playButton.addEventListener('click', function(e) {
	recorderState = null;
	animateScroll();
});

/* preview and download button event listener */
previewDownloadButton.addEventListener('click', function(e) {
	// disabling button to avoid click when starts processing
	previewDownloadButton.disabled = true;
	// Capture canvas as video stream
	const stream = canvas.captureStream(fps.value);

	// Use MediaRecorder to record the stream
	const recorder = new MediaRecorder(stream);
	const videoChunks = [];
	// stores stream video chunks into array of chunks
	recorder.ondataavailable = (e) => videoChunks.push(e.data);
	// recorder event when its stops
	recorder.onstop = () => {
		// creating video blob data
		const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
		// creating video object URL to download
		const videoUrl = URL.createObjectURL(videoBlob);

		// Create a downloadable link
		const link = document.createElement('a');
		link.href = videoUrl;
		link.download = 'canvas_video.webm';
		link.click();

		// Revoke object URL to avoid memory leaks
		URL.revokeObjectURL(videoUrl);

		// enabling button for next time use
		previewDownloadButton.disabled = false;

	};

	// starting record
	recorder.start();	

	animateScroll(recorder);
});


// animation function
function animateScroll(recorder=null) {

	// if this function is called by play or preview then need to stop the canvas animation frames
	if (preferenceObj.isAnimationPlaying && preferenceObj.object != null) {
		preferenceObj.object.stopAnimation();
	}

	// getting user text input
	let text = inputText.value;

	// creating ScrollText class animation object 
	const aniObj = new ScrollText(text);

	// setting recorder reference
	aniObj.recorder = recorder;

	// calling scroll method to start animation
	aniObj.scroll(0);

	// setting ScrollText class object for further reference
	preferenceObj.setAnimationObject(aniObj);

	// setting animation play as true means playing and false means stopping
	preferenceObj.isAnimationPlaying = true;
}


