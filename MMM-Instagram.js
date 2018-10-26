/* global Module */

/* Magic Mirror
 * Module: MMM-Instagram
 *
 * By Jim Kapsalis https://github.com/kapsolas
 * MIT Licensed.
 */

Module.register('MMM-Instagram', {

    defaults: {
        format: 'json',
        lang: 'en-us',
        id: '',
        animationSpeed: 1000,
        updateInterval: 60000, // 10 minutes
        access_token: '',
        count: 200,
        min_timestamp: 0,
        loadingText: 'Loading...',
        useLowResolution: true,
        showCaptureText: false,
        maxSizeCaptureText: 200,
        showVideo: true,
        videoStdRes: false,
    },
    
    // Define required scripts
    getScripts: function() {
        return ["moment.js"];
    },
    
    /*
    // Define required translations
    getTranslations: function() {
        return false;
    },
    */
    
    // Define start sequence
    start: function() {
        Log.info('Starting module: ' + this.name);
        this.data.classes = 'bright medium';
        this.loaded = false;
        this.images = {};
        this.activeItem = 0;
        this.url = 'https://api.instagram.com/v1/users/self/media/recent' + this.getParams();
        this.grabPhotos();
    },

    grabPhotos: function() {
        // the notifications are not working for some reason... so we won't do anything asynchronously
        // we will just make the call to the method to get the object with photo links....
        //Log.info('sending socket notification: INSTAGRAM_GET and URL: ' + this.url);
        this.sendSocketNotification("INSTAGRAM_GET", this.url);
        
        // this may not be needed... need to think about it.
        //setTimeout(this.grabPhotos, this.config.interval, this);
    },
    
    
    getStyles: function() {
        return ['instagram.css', 'font-awesome.css'];
    },

    // Override the dom generator
    getDom: function() {
        var wrapper = document.createElement("div");
        var imageDisplay = document.createElement('div'); //support for config.changeColor

        if (!this.loaded) {
            wrapper.innerHTML = this.config.loadingText;
            return wrapper;
        }
        
        // set the first item in the list...
        if (this.activeItem >= this.images.photo.length) {
            this.activeItem = 0;
        }
        
        var tempimage = this.images.photo[this.activeItem];
        var elementDisplay = this.getElementToDisplay(tempimage);
        Log.info("Element:"+elementDisplay);
        
        // image
        var imageLink = document.createElement('div');
        //imageLink.innerHTML = "<img src='https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'>";
        imageLink.id = "MMM-Instagram-image";

        var tagBase = "";
        var fig = document.createElement("figure");

        fig.appendChild(elementDisplay);
        //imageLink.innerHTML = "<img src='" + tempimage.photolink + "'>";

        //check if display subtitle
        if (this.config.showCaptureText) {
            fig.appendChild(this.getTextToDisplay(tempimage.captureText));
        }

        imageLink.appendChild(fig);
        
        imageDisplay.appendChild(imageLink);
        wrapper.appendChild(imageDisplay);
       
        return wrapper;
    },
    getTextToDisplay:function(text) {
        var figCap = document.createElement("figcaption");
        var innerDiv = document.createElement("div");
        var imgInsta = document.createElement("img");
        var textInsta = document.createTextNode(" Instagram");
        var textNode = "";

        innerDiv.className= "small light";
        imgInsta.src = "https://www.instagram.com/favicon.ico";
        innerDiv.appendChild(imgInsta);
        innerDiv.appendChild(textInsta);

        if (text.length>this.config.maxSizeCaptureText) {
            text = text.substring(0,this.config.maxSizeCaptureText)+"...";
        }
        textNode = document.createTextNode(text);
        figCap.appendChild(innerDiv);
        figCap.appendChild(textNode);
        return figCap;
    },
    getElementToDisplay:function(item) {
        var result;
        if (item.type == 'video' && this.config.showvideo) {
            var source = document.createElement("source");
            result = document.createElement("video");
            source.src = (this.config.useLowResolution?item.videolink:item.videolinkH);
            source.type = "video/mp4";
            result.appendChild(source);
            result.setAttribute("autoplay");
        }
        if (item.type == 'image') {
            result = document.createElement("img");
            result.src = (this.config.useLowResolution?item.photolink:item.photolinkH);
        }
        return result;
    },
    /* scheduleUpdateInterval()
     * Schedule visual update.
     */
    scheduleUpdateInterval: function() {
        var self = this;

        Log.info("Scheduled update interval set up...");
        self.updateDom(self.config.animationSpeed);

        setInterval(function() {
            Log.info("incrementing the activeItem and refreshing");
            self.activeItem++;
            self.updateDom(self.config.animationSpeed);
        }, this.config.updateInterval);
    },

    /*
     * getParams()
     * returns the query string required for the request to flickr to get the 
     * photo stream of the user requested
     */
    getParams: function() {
        var params = '?';
        params += 'count=' + this.config.count;
        params += '&min_timestamp=' + this.config.min_timestamp;
        params += '&access_token=' + this.config.access_token;
        return params;
    },

    // override socketNotificationReceived
    socketNotificationReceived: function(notification, payload) {
        //Log.info('socketNotificationReceived: ' + notification);
        if (notification === 'INSTAGRAM_IMAGE_LIST')
        {
            //Log.info('received INSTAGRAM_IMAGE_LIST');
            this.images = payload;
            
            //Log.info("count: " +  this.images.photo.length);
            
            // we want to update the dom the first time and then schedule next updates
            if (!this.loaded) {
            this.updateDom(1000);
                this.scheduleUpdateInterval();
            }
            
            this.loaded = true;
        }
    }

});
