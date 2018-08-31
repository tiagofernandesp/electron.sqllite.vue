const path = require('path')
const url = require('url')
const remote = require('electron').remote;
const knexconn = require('./knexconn.js');

const ipc = require('electron').ipcRenderer;
var knex = knexconn.knex;


var vm = new Vue({
    el: '#app',
    data: {
        bdata: [],
        selectedMaquina: {
            newid: '',
            id: '',
            kg: '',
            tipo: '',
            status: ''
        }
    },
    mounted() {
        this.getAllData();
    },
    methods: {
        goEncomendas: function (id) {
            ipc.send('load-page', 'file://' + __dirname + '/index.html');
        },
        goGuias: function (id) {
            ipc.send('load-page', 'file://' + __dirname + '/guia.html');
        },
        goMaquinas: function () {
            ipc.send('load-page', 'file://' + __dirname + '/maquinas.html');
        },
        goReceitas: function () {
            ipc.send('load-page', 'file://' + __dirname + '/receitas.html');
        },
        resetSelectedMaquina: function () {
            this.selectedMaquina.id = '';
            this.selectedMaquina.newid = '';
            this.selectedMaquina.kg = '';
            this.selectedMaquina.tipo = '';
            this.selectedMaquina.status = '';
        },
        getAllData: function () {
            this.bdata='';
            knex('Maquinas').select()
                .then((rows) => {
                    if (rows.length > 0)
                        this.bdata = rows;
                })
        },
        removeMaquina: function () {
            knex('Maquinas').where('id', '=', this.selectedMaquina.id).del()
                .then((rows) => {
                    this.getAllData();

                    this.resetSelectedMaquina();
                }).catch(function (e) {
                    alert("Erro ao remover a maquina!", "Alerta");
                });
        },
        editMaquina: function (row) {
            this.selectedMaquina.id = row.id;
            this.selectedMaquina.newid = row.id;
            this.selectedMaquina.kg = row.kg;
            this.selectedMaquina.tipo = row.tipo;
            this.selectedMaquina.status = row.status;
        },
        saveMaquina: function () {
            if (this.selectedMaquina.id != '') {
                this.updateMaquina()
                    .then(
                    () => {
                        this.getAllData();

                        this.resetSelectedMaquina();
                    }
                    ).catch(function (e) {
                        alert("Erro ao editar a maquina!", "Alerta");
                    });
            }
            else {
                this.addMaquina()
                    .then(
                    () => {
                        this.getAllData();

                        this.resetSelectedMaquina();
                    }
                    )
                    .catch(function (e) {
                        alert("Erro ao adicionar a maquina!", "Alerta");
                    });
            }  
        },
        updateMaquina: function () {
            return knex('Maquinas').where('id', '=', this.selectedMaquina.id).update({
                id: this.selectedMaquina.newid,
                kg: this.selectedMaquina.kg,
                tipo: this.selectedMaquina.tipo,
                status: this.selectedMaquina.status,
            }).catch(function (e) {
                alert("Erro ao editar a maquina!", "Alerta");
            });
        },
        addMaquina: function () {
            return knex('Maquinas').insert({
                id: this.selectedMaquina.newid,
                kg: this.selectedMaquina.kg,
                tipo: this.selectedMaquina.tipo,
                status: this.selectedMaquina.status,
            }).catch(function (e) {
                alert("Erro ao adicionar a maquina!", "Alerta");
            });
        },
        newMaquina: function () {
            this.resetSelectedMaquina();

        }
    }
})
