const path = require('path')
const url = require('url')
const remote = require('electron').remote;
const knexconn = require('./knexconn.js');

const ipc = require('electron').ipcRenderer;
var knex = knexconn.knex;


var vm = new Vue({
    el: '#app',
    data: {
        pesquisa:'',
        bdata: [],
        selectedReceita: {
            id: '',
            numero: '',
            descricao: '',
            kg: ''
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
        goReceitas: function () {
            ipc.send('load-page', 'file://' + __dirname + '/receitas.html');
        },
        goMaquinas: function () {
            ipc.send('load-page', 'file://' + __dirname + '/maquinas.html');
        },
        resetSelectedReceita: function () {
            this.selectedReceita.id = '';
            this.selectedReceita.numero = '';
            this.selectedReceita.descricao = '';
            this.selectedReceita.kg = '';
        },
        getAllDataOlder: function () {
            this.bdata='';
            knex('Receitas').select()
                .then((rows) => {
                    if (rows.length > 0)
                        this.bdata = rows;
                })
        },
        getAllData: function () {
            this.bdata='';
            knex('Receitas').select().limit(25)
                .then((rows) => {
                    if (rows.length > 0)
                        this.bdata = rows;
                })
        },
        removeReceita: function () {
            knex('Receitas').where('id', '=', this.selectedReceita.id).del()
                .then((rows) => {
                    this.getAllData();

                    this.resetSelectedReceita();
                }).catch(function (e) {
                    alert("Erro ao remover a Receita!", "Alerta");
                });
        },
        editReceita: function (row) {
            this.selectedReceita.id = row.id;
            this.selectedReceita.numero = row.numero;
            this.selectedReceita.descricao = row.descricao;
            this.selectedReceita.kg = row.kg;
        },
        saveReceita: function () {
            if (this.selectedReceita.id != '') {
                this.updateReceita()
                    .then(
                    () => {
                        this.getAllData();

                        this.resetSelectedReceita();
                    }
                    ).catch(function (e) {
                        alert("Erro ao editar a Receita!", "Alerta");
                    });
            }
            else {
                this.addReceita()
                    .then(
                    () => {
                        this.getAllData();

                        this.resetSelectedReceita();
                    }
                    )
                    .catch(function (e) {
                        alert("Erro ao adicionar a Receita!", "Alerta");
                    });
            }  
        },
        updateReceita: function () {
            return knex('Receitas').where('id', '=', this.selectedReceita.id).update({
                numero: this.selectedReceita.numero,
                descricao: this.selectedReceita.descricao,
                kg: this.selectedReceita.kg,
            }).catch(function (e) {
                alert("Erro ao editar a Receita!", "Alerta");
            });
        },
        addReceita: function () {
            return knex('Receitas').insert({
                numero: this.selectedReceita.numero,
                descricao: this.selectedReceita.descricao,
                kg: this.selectedReceita.kg,
            }).catch(function (e) {
                alert("Erro ao adicionar a Receita!", "Alerta");
            });
        },
        newReceita: function () {
            this.resetSelectedReceita();

        }
    }
})
