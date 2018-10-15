const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const url = require('url')
const os = require("os");
const fs = require("fs");

let win;
let workerWindow;

ipcMain.on('load-page', (event, arg) => {
  win.loadURL(arg);
});
/*
var mes = new Date().getMonth();
if(mes>1){
  app.quit()
}*/
 app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

function createWindow() {
  //Main view
  win = new BrowserWindow({ 
    show: false , 
    icon: __dirname + '/template/img/icon.jpg' })
  win.setMenu(null);
  win.maximize();
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'app', 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  
  win.once('ready-to-show', () => {
    win.show();
  })
  //win.webContents.openDevTools()
  win.on('closed', () => {
    win = null;
    workerWindow = null;
    app.quit();
  })

  workerWindow = new BrowserWindow({ show: false});
  workerWindow.setMenu(null);
  workerWindow.loadURL("file://" + __dirname + "/app/worker.html");
  //workerWindow.hide();
  //workerWindow.webContents.openDevTools();
  workerWindow.on("closed", () => {
    workerWindow = undefined;
  });
}

// retransmit it to workerWindow
ipcMain.on("printPDF", (event, content) => {
  workerWindow.webContents.send("printPDF", content);
});
// when worker window is ready
ipcMain.on("readyToPrintPDF", (event) => {
  var d = new Date();
  var randomName = d.getTime();
  const pdfPath = path.join(os.tmpdir(), 'print'+randomName+'.pdf');
  // Use default printing options
  workerWindow.webContents.printToPDF({ landscape: true, marginsType: 1 }, function (error, data) {
    if (error) throw error
    fs.writeFile(pdfPath, data, function (error) {
      if (error) {
        throw error
      }
      shell.openItem(pdfPath)
      event.sender.send('wrote-pdf', pdfPath)
    })
  })
});