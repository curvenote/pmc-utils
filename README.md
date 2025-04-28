# pmc-utils

Run a faux web application using the `pmc-web` client code

```
npm install
npm run dev
```

Given a manifest use the CLI to create a deposit `.tar.gz` file

```
npm install
npm run dev
pmc build-deposit deposits/job/task-1234/manifest.json
```

## FTP install

To set up local FTP server on mac, I used [FileZilla](https://filezilla-project.org/download.php?platform=macos-arm64&type=server). After downloading and unzipping, first right-click on `FileZilla Server` then `Show Package Contents`. Navigate to `Contents > MacOS > filezilla-server`. This will start the server in a terminal window.

Then, return to your downloads and just open `FileZilla Server` as normal; this will open the admin interface. Connect to server with host `localhost`, port `14148`, and no password (this should be the default).

After a successful connection, add a new user: From the menu, `Server > Configure...` then click on `Users` under `Rights management`, then `Add`. Give a username and a password (I used `curvenote`/`curvenote`), and add a mount point with read/write permissions (I used virtual path `/` and native path `/Users/franklin/git/curvenote/pmc-utils/ftp`).

Also, to enable basic username/password FTP access, go to `Server listeners` and change the protocols to `Explicit FTP over TLS and insecure plain FTP`.

You can then make sure things work correctly using an FTP client. To install CLI FTP client on mac:

```
brew install inetutils
```

To connect to your local server:

```
ftp localhost 21
```

It should prompt for username/password, then successfully login and connect to the "native path" you specified.