const request     = require('request')

 /**
  * The functions in this event handler will be invoked based on the name of the 
  * incoming event (see the readme for a list of all event). All events are named 
  * with the convention 'object.action'. If the name of the incoming event is 
  * 'asset.create' the on_asset_create function will be invoked. The function 
  * names should follow the convention 'on_object_action'. If the function does not 
  * exist then we will no op.
  * 
  * The example below impliments the on_asset_create function. However, you could create 
  * function for other events in the same way and they would be invoked when the respective 
  * event is triggered.
  */
const EventHandler = (function() {
  return {

    /**
     * Anytime we recieve an asset.create event we'll we'll upload that video to wevideo
     */
    on_asset_create: function(event, next) {

      let self = this;

      // We want to mirror the file structure from Shift to Wevideo. So, the first thing 
      // we want to do is to determine the full file path of this video
      this.shift_GetFolderPath(event.entity.asset.folderId, "", function(err, path) {
        if(err) {
          console.log(`Err: ${err}`);
        } else {

          let shiftVideoPath = `${event.entity.project.name}${path}`;
          // The path swe use for we video differs from the full path we get from shift 
          // because we'll use both the project name and the app name to prefix the folder 
          // path. So, a path to a file in Shift like /path/to/my/file will be 
          // /myapp/myproject/path/to/my/file in Wevideo/
          let wevideoPath = `${process.env.WEVIDEO_SHARED_SUBFOLDER_NAME}/${shiftVideoPath}`

          console.log(`Syncing video ${event.entity.asset.id} from ${shiftVideoPath} to Wevideo at ${wevideoPath}`);
          // In order to upload to the "Sahred with Everyone" space in Wevideo we need to 
          // get the ID of the shared root folder. This folder is our root folder for all 
          // of our uploads
          self.wevideo_GetRootFolderId(function(err, rootFolderId) {
            if(err) {
              console.log(`Err: ${err}`);
            } else {
              let currentIndex = 0;
              let folderParts = wevideoPath.split('\/');

              // This is where we mirror the files structure into Wevideo. For each node in the file 
              // path we'll check to see if the folder exists and create it if it doesn't
              function wevideo_TryCreateFolder(parentFolderId, callback) {
                if(currentIndex < folderParts.length) {
                  self.wevideo_CreateFolder(parentFolderId, folderParts[currentIndex], function(err, folder) {
                    if(err) {
                      callback(err, null)
                    } else {
                      currentIndex++;
                      wevideo_TryCreateFolder(folder.id, callback);
                    }
                    
                  });
                } else {
                  callback(null, parentFolderId);
                }
              }

              wevideo_TryCreateFolder(rootFolderId, function(err, lastChildFolderId) {

                // Now that we have ensure the file structure is mirrored from Shift to Wevideo we 
                // can safeley upload the asset to Wevideo
                let sourceDerivative = event.entity.asset.derivatives.filter(derivative => derivative.type === "source")[0]
                self.wevideo_UploadVideoFromURL(sourceDerivative, event.entity.asset.title, lastChildFolderId, function(err, callback) {
                  if(err) {
                    callback(err, null)
                  } else {
                    console.log(`Finished syncing video ${event.entity.asset.id}`);
                  }

                 
                })
              });
          }
          })
        }
        next();
      })
    },
    /**
     * This function uses the Shift source derivative to create a new video in Wevideo. 
     * Wevideo requires a folder ID to which to upload the media.
     */
    wevideo_UploadVideoFromURL: function(sourceDerivative, name, parentFolderId, callback) {
      request({
        method: 'POST',
        body: [{
          url: sourceDerivative.url,
          size: sourceDerivative.fileSize,
          title: name
        }],
        json: true,
        url: `https://www.wevideo.com/api/3/upload/urlimport/${parentFolderId}`,
        headers: {
          'Authorization': `WEVSIMPLE ${process.env.WEVIDEO_API_SECRET}`,
          'Content-Type': 'application/json'
        }
      
      }, function (err, response, body) {
        if (err) {
          callback(err, null)
        } else {
          callback(null, null)
        }
      }) 
    },
    /**
     * This function produces a folder path for a given folder by traversing up the 
     * folder hierarchy
     */
    shift_GetFolderPath: function(currentFolderId, path, callback) {
      if(currentFolderId) {
        var self = this;
        request({
          method: 'GET',
          headers: {
            'MediaSiloHostContext': `${process.env.SHIFT_DOMAINNAME}`,
            'Accept-Type': 'application/json'
          },
          url: `https://${process.env.SHIFT_USERNAME}:${process.env.SHIFT_PASSWORD}@api.mediasilo.com/v3/folders/${currentFolderId}`,
          
        
        }, function (err, response, body) {
          let folder = JSON.parse(body);
          if (err) {
            callback(err, null);
          } else {
            path += `/${folder.name}`
          }

          if(folder.parentId) {
            self.shift_GetFolderPath(folder.parentId, path, callback);
          } else {
            callback(null, path);
          }
        })
      } else {
        callback(null, '/');
      }
    },
    /**
     * This function gets the "Shared with Everyone" folder ID. We use this folder 
     * for all assets we upload to Wevideo.
     */
    wevideo_GetRootFolderId: function(callback) {
      request({
        method: 'GET',
        headers: {
          'Authorization': `WEVSIMPLE ${process.env.WEVIDEO_API_SECRET}`,
          'Content-Type': 'application/json',
          'Accept-Type': 'application/json'
        },
        url: `https://www.wevideo.com/api/3/instances/${process.env.WEVIDEO_API_INSTANCE_ID}`,
      }, function (err, response, body) {
        if (err) {
          callback(err, null);
        } else {
          let instance = JSON.parse(body);
          callback(null, instance.sharedRootFolder)
        }
      }) 
    },
    wevideo_CreateFolder: function(parentFolderId, folderName, callback) {
      let self = this;
      request({
        method: 'GET',
        headers: {
          'Authorization': `WEVSIMPLE ${process.env.WEVIDEO_API_SECRET}`,
          'Content-Type': 'application/json',
          'Accept-Type': 'application/json'
        },
        url: `https://www.wevideo.com/api/3/media/${parentFolderId}/folders`,
      }, function (err, response, body) {
        
        if (err) {
          callback(err, null);
        } else {
          let folders = JSON.parse(body).data || [];
          for(let i=0; i<folders.length; i++) {
            if(folders[i].title === folderName) {
              callback(null, {id: folders[i].id, name: folders[i].title})
              return;
            }
          }
          
          request({
            method: 'POST',
            headers: {
              'Authorization': `WEVSIMPLE ${process.env.WEVIDEO_API_SECRET}`,
              'Content-Type': 'application/json'
            },
            body: {name: folderName},
            json: true,
            url: `https://www.wevideo.com/api/3/media/${parentFolderId}/folder`,
          }, function (err, response, folder) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, {id: folder.id, name: folder.name})
            }
          }) 
        }
      }) 
    }
  };
})();

/**
 * The following code handles the creation on the server which has a single 
 * route, /events, which handles incoming shift events
 */
const express     = require('express')
const server      = express()
const bodyParser  = require('body-parser')


server.use(bodyParser.json())

/**
 * We use jade for the "next steps" page that we show immediately after the 
 * heroku app is started. Otherwise you don't need this or the "next steps" route below
 */
server.set('views', __dirname + '/views')
server.set('view engine', 'jade')
server.use(express.static(__dirname + '/public'))

server.get('/next-steps', function (req, res) {
  res.render('next-steps', {})
})


/**
 * Event Route
 * 
 * This route recieves incoming webhooks from shift
 */
server.post('/events', function (req, res) {
    var event = req.body;
    var eventHandlerFunctionName = 'on_' + event.eventName.replace('.', '_');

    if(event && event.eventName && EventHandler.hasOwnProperty(eventHandlerFunctionName)) {
      EventHandler[eventHandlerFunctionName](event, function() {
        res.sendStatus(200);
      })
    } else {
      res.sendStatus(200);
    }
  }
)

const port = process.env.PORT || 8080;
server.listen(port, () => console.log('Shift integration app running on port ' + port + '!'))

