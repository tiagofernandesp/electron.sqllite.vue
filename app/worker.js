const ipcRenderer = require("electron").ipcRenderer;
var lista;
ipcRenderer.on("printPDF", (event, content) => {
    vm.print(content);
    //ipcRenderer.send("readyToPrintPDF");
});

var vm = new Vue({
    el: '#app',
    data: {
        intervencoes: ''
    },
    methods: {
        print: function (content) {
            /*for (var i = content.length - 1; i >= 0; i--) {
                console.log("id:" + content[i].id);
            }*/

            this.intervencoes = content;
            //console.log(content);
            ipcRenderer.send("readyToPrintPDF");
        }
    }
})