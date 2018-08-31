const path = require('path')
const url = require('url')
const remote = require('electron').remote;
const knexconn = require('./knexconn.js');

const ipc = require('electron').ipcRenderer;
var knex = knexconn.knex;

var id = getParameterByName('id');
var vm = new Vue({
    el: '#app',
    data: {
        bdata: [],
        selectedEncomenda: {
            cliente_nome: '',
            cliente_po: '',
            ordem_int: '',
            composicao: '',
            descricao: '',
            peso_peca: '',
            quantidade: '',
            id: ''
        },
        pesquisa: '',
        currentStatus: {
            nint:0,
            quant:0
        }
    },
    mounted() {
        this.getAllData();
    },
    methods: {
        goEncomendas: function (id) {
            ipc.send('load-page', 'file://' + __dirname + '/index.html?id=' + id);
        },
        goGuias: function (id) {
            ipc.send('load-page', 'file://' + __dirname + '/guia.html?id=' + id);
        },
        goMaquinas: function () {
            ipc.send('load-page', 'file://' + __dirname + '/maquinas.html');
        },
        goReceitas: function () {
            ipc.send('load-page', 'file://' + __dirname + '/receitas.html');
        },
        resetSelectedEncomenda: function () {
            this.selectedEncomenda.cliente_nome = '';
            this.selectedEncomenda.ordem_int = '';
            this.selectedEncomenda.composicao = '';
            this.selectedEncomenda.descricao = '';
            this.selectedEncomenda.peso_peca = '';
            this.selectedEncomenda.quantidade = '';
            this.selectedEncomenda.id = '';
            this.selectedEncomenda.cliente_po = '';
            this.currentStatus.nint = 0;
            this.currentStatus.quant = 0;
        },
        getCurrentStatus: function (id) {
            this.currentStatus.nint = 0;
            this.currentStatus.quant = 0;
            knex.select()
                .from('Intervencao')
                .innerJoin('Guia', function () {
                    this.on('Guia.id_encomenda', knex.raw('?', [id])).andOn('Guia.id', 'Intervencao.id_guia')
                }).orderBy('Intervencao.id_intervencao', 'desc')
                .then((rows) => {
                    for(var i=0;i<rows.length;i++){
                        this.currentStatus.nint+=1;
                        this.currentStatus.quant+=rows[i].quantidade_int;
                    }
                })
        },
        getAllData: function () {
            this.bdata='';
            knex('Encomenda').select().limit(50)
                .then((rows) => {
                    if (rows.length > 0)
                        this.bdata = rows;
                })
        },
        getAllDataOlder: function () {
            this.bdata='';
            knex('Encomenda').select()
                .then((rows) => {
                    if (rows.length > 0)
                        this.bdata = rows;
                })
        },
        removeEncomenda: function () {
            knex('Encomenda').where('id', '=', this.selectedEncomenda.id).del()
                .then((rows) => {
                    this.getAllData();

                    this.resetSelectedEncomenda();
                })
        },
        editEncomenda: function (row) {
            this.selectedEncomenda.cliente_nome = row.cliente_nome;
            this.selectedEncomenda.ordem_int = row.ordem_int;
            this.selectedEncomenda.composicao = row.composicao;
            this.selectedEncomenda.descricao = row.descricao;
            this.selectedEncomenda.peso_peca = row.peso_peca;
            this.selectedEncomenda.quantidade = row.quantidade;
            this.selectedEncomenda.id = row.id;
            this.selectedEncomenda.cliente_po = row.cliente_po;
            this.getCurrentStatus(this.selectedEncomenda.id);
        },
        saveEncomenda: function () {
            if (this.selectedEncomenda.id != '') {
                this.updateEncomenda()
                    .then(
                    () => {
                        this.getAllData();

                        this.resetSelectedEncomenda();
                    }
                    ).catch(function (e) {
                        console.log("Erro: " + e);
                    });
            }
            else {
                this.addEncomenda()
                    .then(
                    () => {
                        this.getAllData();

                        this.resetSelectedEncomenda();
                    }
                    )
                    .catch(function (e) {
                        console.log("Erro: " + e);
                    });
            }
        },
        updateEncomenda: function () {
            return knex('Encomenda').where('id', '=', this.selectedEncomenda.id).update({
                cliente_nome: this.selectedEncomenda.cliente_nome,
                cliente_po: this.selectedEncomenda.cliente_po,
                ordem_int: this.selectedEncomenda.ordem_int,
                composicao: this.selectedEncomenda.composicao,
                descricao: this.selectedEncomenda.descricao,
                peso_peca: this.selectedEncomenda.peso_peca,
                quantidade: this.selectedEncomenda.quantidade
            })
        },
        addEncomenda: function () {
            return knex('Encomenda').insert({
                cliente_nome: this.selectedEncomenda.cliente_nome,
                cliente_po: this.selectedEncomenda.cliente_po,
                ordem_int: this.selectedEncomenda.ordem_int,
                composicao: this.selectedEncomenda.composicao,
                descricao: this.selectedEncomenda.descricao,
                peso_peca: this.selectedEncomenda.peso_peca,
                quantidade: this.selectedEncomenda.quantidade
            })
        },
        newEncomenda: function () {
            this.resetSelectedEncomenda();

        }
    }
})

function getParameterByName(name, url) {
    if (!url) url = global.location.search;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}