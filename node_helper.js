/* Magic Mirror
 * Module: MMM-Instagram
 *
 * By Jim Kapsalis https://github.com/kapsolas
 * MIT Licensed.
 */

 var NodeHelper = require("node_helper");
 var request = require('request');
 
 module.exports = NodeHelper.create({
    // subclass start method.
    start: function() {
        console.log("Starting node_helper for module [" + this.name + "]");
    },
    
    // subclass socketNotificationReceived
    socketNotificationReceived: function(notification, payload){
        //console.log("=========== notification received: " + notification);
        if (notification === 'INSTAGRAM_GET') {
            this.getImagesFromJSON(payload);
        }
    },
    
    getImagesFromJSON: function(api_url) {
        //console.log('============ HERE =================');
        var self = this;
        request({url: api_url, method: 'GET'}, function(error, response, body) 
        {
            if (!error && response.statusCode == 200) 
            {
                // get our images out of the INSTAGRAM JSON response
                var items = JSON.parse(body).data;
                
                // create our model, a dictionary with 
                var images = {};
                images.photo = new Array();
                
                for (var i in items)
                {
                    var type = items[i].type;
                    var mediaL = items[i].images.low_resolution.url;
                    var mediaH = items[i].images.standard_resolution.url;
                    var videoL = "";
					var duration = "";
                    if (type == 'video') {
                        videoL = items[i].videos.low_resolution.url;
						getDuration(videoL).then((duration) => {
							console.log(duration);
						});
                    }
                    var text = items[i].caption.text;
                    
                    //console.log("type: " + type + "\nmedia: " + media +"\ntext:" + text);
                    
                    // create a new array for each images object in the dictionary
                    images.photo.push( {
                        "type" : type,
                        "photolinkL" : mediaL,
                        "photolinkH": mediaH,
                        "videolinkL": videoL,
                        "captureText": text
                    });
                }
                //console.log("count: " + images.photo.length);
                self.sendSocketNotification('INSTAGRAM_IMAGE_LIST', images);
                
            }
            else
            {
                console.log(" Error: " + response.statusCode);
            }
        });
    }
 });