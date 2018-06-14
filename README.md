
The intent of this project is to show you how simple it is to create custom applications for SHIFT. This example app shows how you can send messages to Slack when new assets are created in SHIFT. You can create an itegration with your own apps or third party services, too. 

There are 3 steps to getting this example app running. It takes 10 minutes. I timed it so I know.

### Step 1

Make sure that you have you Wevideo Instance ID and API secret handy


### Step 2
Fill out the heroku app deployment configuration

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/shiftio/shift-wevideo-integration)

![Heroku configuration](public/img/heroku-config.png)

### Step 3

Visit you new Heroku app by clicking the "View" link at the bottom of the page and create the SHIFT webhook.

![Heroku view button](public/img/heroku-view.png)

### Finally
Any time you create a new asset it will be uploaded to you "Shared with Everyone" folder in Wevideo.

That's it! You've created a SHIFT app. Congrats!

### Events
This project shows how to use the "asset create" event. But there are many more. See the list below and reference the code in [server.js](server.js) to see how you can make this your own.

#### All events:
* PROJECT.CREATE, PROJECT.UPDATE, PROJECT.DELETE,
 * PROJECT_USERS.CREATE, PROJECT_USERS.UPDATE, PROJECT_USERS.DELETE, 
 * PROJECT_INVITATION.CREATE, PROJECT_INVITATION.UPDATE, PROJECT_INVITATION.DELETE,
 * PROJECT_ROLES.CREATE, PROJECT_ROLES.UPDATE, PROJECT_ROLES.DELETE
 
 * ASSET.CREATE, ASSET.UPDATE, ASSET.DELETE, ASSET.DOWNLOAD,
 * ASSET_METADATA.CREATE, ASSET_METADATA.UPDATE, ASSET_METADATA.DELETE,
 * ASSET_COMMENT.CREATE, ASSET_COMMENT.UPDATE, ASSET_COMMENT.DELETE,
 
 * FOLDER.CREATE, FOLDER.UPDATE, FOLDER.DELETE,
 
 * QUICKLINK.CREATE, QUICKLINK.UPDATE, QUICKLINK.DELETE, QUICKLINK_SHARE.CREATE,
 
 * SESSION.CREATE,
 
 * USER.CREATE, USER.UPDATE, USER.DELETE
 
 