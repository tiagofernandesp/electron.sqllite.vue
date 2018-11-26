const path = require('path')
const url = require('url')
const remote = require('electron').remote;
const ipcRenderer = require("electron").ipcRenderer;
const knexconn = require('./knexconn.js');

const ipc = require('electron').ipcRenderer;
var knex = knexconn.knex;
const ph_min = 6.3;
const ph_max = 6.8;

var id = getParameterByName('id');
var dataAtual = new Date();
function sendCommandToWorker(content) {
    ipcRenderer.send("printPDF", content);
}

var arrayMes = new Array(12);
arrayMes[0] = "Jan";
arrayMes[1] = "Fev";
arrayMes[2] = "Mar";
arrayMes[3] = "Abr";
arrayMes[4] = "Mai";
arrayMes[5] = "Jun";
arrayMes[6] = "Jul";
arrayMes[7] = "Ago";
arrayMes[8] = "Set";
arrayMes[9] = "Out";
arrayMes[10] = "Nov";
arrayMes[11] = "Dez";

function getMes(mes) {
    return arrayMes[mes];
}


var vm = new Vue({
    el: '#app',
    data: {
        gerarbd: {
            ph: '',
            ph_ini: '',
            id_receita: '',
            receita_kg_max: 0,
            id_intervencao: '',
            data: dataAtual.getDate() + ' ' + getMes(1),
            quantidade_total: '',
            quantidade_atual: 0,
            m_lavar: {},
            m_secar: {}
        },
        bdata: [],
        bdintervencao: [],
        selected: {
            n_transporte: '',
            nome_transporte: '',
            quantidade_guia: '',
            id_encomenda: '',
            id: ''
        },
        selectedint: {
            id: '',
            id_intervencao: '',
            quantidade_int: '',
            quilos: '',
            id_maquina_lavar: '',
            id_maquina_secar: '',
            data: '',
            ph: '',
            id_guia: '',
            id_receita: '',
            numero_receita: ''
        },
        bdencomenda: {
            cliente_nome: '',
            cliente_po: '',
            ordem_int: '',
            composicao: '',
            descricao: '',
            peso_peca: '',
            quantidade: '',
            id: ''
        },
        msecar: [],
        mlavar: [],
        receitas: [],
        accordion: '0',
        printdata: '<p>Print bro</p>',
        print_int_ini: '',
        print_int_fin: '',
        print_guia: '',
        print_ph: true,
        tipoimpressao: 'guia',
        pesquisaint: '',
        pesquisaguia: ''
    },
    mounted() {
        this.getAllData();
    },
    filters: {

    },
    methods: {
        gerarIntervencoes: function () {

            g = this.gerarbd;
            g.min_maq_lavar_kg = 999;
            g.id_guia = this.selected.id;
            g.ph = 6.5;
            g.receita_kg_max = 0;
            g.id_intervencao = 0;
            g.quantidade_atual = 0;
            g.quantidade_total = this.selected.quantidade_guia;

            for (var i = 0; i < this.receitas.length; i++) {
                if (this.receitas[i].id == g.id_receita && this.receitas[i].kg > 0) {
                    g.receita_kg_max = this.receitas[i].kg;
                }
            }
            for (var i = 0; i < this.mlavar.length; i++) {
                if (this.mlavar[i].kg < g.min_maq_lavar_kg) {
                    g.min_maq_lavar_kg = this.mlavar[i].kg
                }
                var aux = {
                    id: this.mlavar[i].id,
                    kg: this.mlavar[i].kg,
                    n_intervencoes: 0,
                    n_ph: 0,
                    ph: 0,
                    id_int:0
                }
                g.m_lavar[this.mlavar[i].id] = aux;
            }
            for (var i = 0; i < this.msecar.length; i++) {
                var aux = {
                    id: this.msecar[i].id,
                    kg: this.msecar[i].kg,
                    n_intervencoes: 0
                }
                g.m_secar[this.msecar[i].id] = aux;
            }
            for (var i = 0; i < this.bdintervencao.length; i++) {
                if (g.id_intervencao <= this.bdintervencao[i].id_intervencao) {
                    //g.ph = this.bdintervencao[i].ph;
                    if (g.ph_ini == '') { g.ph_ini = this.bdintervencao[i].ph; }
                    if (g.data == '') { g.data = this.bdintervencao[i].data; }

                    g.id_intervencao = this.bdintervencao[i].id_intervencao;
                }
                if (g.m_lavar[this.bdintervencao[i].id_maquina_lavar].id_int < this.bdintervencao[i].id_intervencao) {
                    if (this.bdintervencao[i].ph) {
                        g.m_lavar[this.bdintervencao[i].id_maquina_lavar].ph = this.bdintervencao[i].ph;
                        g.m_lavar[this.bdintervencao[i].id_maquina_lavar].id_int = this.bdintervencao[i].id_intervencao;
                    }
                }
                if (this.bdintervencao[i].id_guia == g.id_guia) {
                    g.quantidade_atual += this.bdintervencao[i].quantidade_int;
                }
                if (g.m_lavar.hasOwnProperty(this.bdintervencao[i].id_maquina_lavar)) { g.m_lavar[this.bdintervencao[i].id_maquina_lavar].n_intervencoes += 1; }
                if (g.m_secar.hasOwnProperty(this.bdintervencao[i].id_maquina_secar)) { g.m_secar[this.bdintervencao[i].id_maquina_secar].n_intervencoes += 1; }

            }
            if (g.ph_ini != '') { g.ph = parseFloat(g.ph_ini); }
            g.id_intervencao += 1;
            var maquina_espera = { id: '', kg: '' };
            var last_ph_vezes = 3;
            var aux=0;
            for (maq_id in g.m_lavar) {
                var res = g.m_lavar[maq_id].n_intervencoes % 3;
                if (res==0 && g.m_lavar[maq_id].n_intervencoes > 0) {
                    g.m_lavar[maq_id].n_ph=3;
                }
                else{
                    g.m_lavar[maq_id].n_ph=res;
                }
                if (g.id_intervencao==1 && aux >1) {
                    g.m_lavar[maq_id].n_ph=3;
                }
                aux+=1;
            }
            //Criar as intervençoes
            while (g.quantidade_total > g.quantidade_atual && g.receita_kg_max > 0) {
                var id_maq_lavar = '';
                var id_maq_secar = '';
                //Maquina Lavar
                var compare1 = { id_low1: -1, val_low1: 99999999999, id_low2: -1, val_low2: 99999999999 }
                for (maq_id in g.m_lavar) {
                    if (g.m_lavar.hasOwnProperty(maq_id)) {
                        if (compare1.id_low1 == -1) {
                            compare1.id_low1 = maq_id; compare1.val_low1 = g.m_lavar[maq_id].n_intervencoes;
                        } else if (compare1.val_low1 > g.m_lavar[maq_id].n_intervencoes) {
                            compare1.id_low2 = compare1.id_low1; compare1.val_low2 = compare1.val_low1;
                            compare1.id_low1 = maq_id; compare1.val_low1 = g.m_lavar[maq_id].n_intervencoes;
                        } else if (compare1.id_low2 == -1 || compare1.val_low2 > g.m_lavar[maq_id].n_intervencoes) {
                            compare1.id_low2 = maq_id; compare1.val_low2 = g.m_lavar[maq_id].n_intervencoes;
                        }
                    }
                }
                //tem 80% prob
                var prob = Math.floor((Math.random() * 10) + 1);
                if (prob < 9 || compare1.id_low2 == -1) {
                    id_maq_lavar = compare1.id_low1;
                    //console.log('1-'+prob);
                } else {
                    id_maq_lavar = compare1.id_low2;
                    //console.log('2-'+prob);
                }
                g.m_lavar[id_maq_lavar].n_intervencoes += 1;
                //console.log(compare.id_low1)
                //console.log(compare.id_low1+' - '+Math.ceil(g.m_lavar[compare.id_low1].kg/this.bdencomenda.peso_peca));

                var compare2 = { id_low1: -1, val_low1: 99999999999, id_low2: -1, val_low2: 99999999999 };
                //Se houver uma maquina em espera
                if (maquina_espera.id != '' && g.m_lavar[id_maq_lavar].kg <= maquina_espera.kg) {
                    id_maq_secar = maquina_espera.id;
                    maquina_espera.id = '';
                    maquina_espera.kg = '';
                } else {
                    for (maq_id in g.m_secar) {

                        if (g.m_secar.hasOwnProperty(maq_id) && g.m_secar[maq_id].kg >= g.m_lavar[id_maq_lavar].kg) {
                            //console.log('Secar-'+g.m_secar[maq_id].kg+' | Lavar-'+g.m_lavar[id_maq_lavar].kg);
                            if (compare2.id_low1 == -1) {
                                compare2.id_low1 = maq_id; compare2.val_low1 = g.m_secar[maq_id].n_intervencoes;
                            } else if (compare2.val_low1 > g.m_secar[maq_id].n_intervencoes) {
                                compare2.id_low2 = compare2.id_low1; compare2.val_low2 = compare2.val_low1;
                                compare2.id_low1 = maq_id; compare2.val_low1 = g.m_secar[maq_id].n_intervencoes;
                            } else if (compare2.id_low2 == -1 || compare2.val_low2 > g.m_secar[maq_id].n_intervencoes) {
                                compare2.id_low2 = maq_id; compare2.val_low2 = g.m_secar[maq_id].n_intervencoes;
                            }
                        }
                    }
                    //tem % prob
                    var prob2 = Math.floor((Math.random() * 10) + 1);
                    if (prob2 < 10) {
                        id_maq_secar = compare2.id_low1;
                        //console.log('1-'+prob2);
                    } else {
                        id_maq_secar = compare2.id_low2;
                        //console.log('2-'+prob2);
                    }

                    //coloca maquina em espera caso haja espaço
                    var aux = g.m_secar[id_maq_secar].kg - g.m_lavar[id_maq_lavar].kg;
                    if (aux >= g.min_maq_lavar_kg) {
                        maquina_espera.id = id_maq_secar;
                        maquina_espera.kg = aux;
                    } else {
                        maquina_espera.id = '';
                        maquina_espera.kg = '';
                    }
                }
                g.m_secar[id_maq_secar].n_intervencoes += 1;

                //FIM intervencao
                var quant_int = Math.ceil(g.m_lavar[id_maq_lavar].kg / this.bdencomenda.peso_peca);
                if (g.quantidade_total < (g.quantidade_atual + quant_int)) {
                    quant_int = g.quantidade_total - g.quantidade_atual;
                }
                if (!g.m_lavar[id_maq_lavar].ph) {
                    g.m_lavar[id_maq_lavar].ph=g.ph;
                }
                //generate PH
               //console.log("nPH:"+g.m_lavar[id_maq_lavar].n_ph);
                if (g.m_lavar[id_maq_lavar].n_ph==3) {
                    var random = Math.floor((Math.random() * 14) + 1);
                    if (g.m_lavar[id_maq_lavar].ph >= ph_max) {
                        g.m_lavar[id_maq_lavar].ph += -0.2;
                    } else if (g.m_lavar[id_maq_lavar].ph <= ph_min) {
                        g.m_lavar[id_maq_lavar].ph += 0.2;
                    } else {
                        switch (random) {
                            case 4,14,13,12:
                                g.m_lavar[id_maq_lavar].ph += 0.1;
                                break;
                            case 3,11,10,9:
                                g.m_lavar[id_maq_lavar].ph += -0.1;
                                break;
                            case 8,7:
                                g.m_lavar[id_maq_lavar].ph += 0.2;
                                break;
                            case 5,6:
                                g.m_lavar[id_maq_lavar].ph += -0.2;
                                break;
                        }
                    }
                    //console.log("1 last_ph_vezes:"+g.m_lavar[id_maq_lavar].n_ph +"PH:"+g.m_lavar[id_maq_lavar].ph);
                    g.m_lavar[id_maq_lavar].n_ph = 1;
                }
                else
                {
                    g.m_lavar[id_maq_lavar].n_ph += 1;
                }
                this.selectedint.id_intervencao = g.id_intervencao;
                this.selectedint.quantidade_int = quant_int;
                this.selectedint.quilos = (quant_int * this.bdencomenda.peso_peca).toFixed();
                this.selectedint.id_maquina_lavar = id_maq_lavar;
                this.selectedint.id_maquina_secar = id_maq_secar;
                this.selectedint.data = g.data;
                //console.log("PH:"+this.selectedint.ph);
                if (this.print_ph) {
                    this.selectedint.ph = g.m_lavar[id_maq_lavar].ph.toFixed(1);
                }
                else {
                    this.selectedint.ph = undefined;
                }
                this.selected.id = g.id_guia;
                this.selectedint.id_receita = g.id_receita;


                this.addIntervencao()
                    .catch(function (e) {
                        alert("Ocurreu um erro ao Gravar as Intervenções!");
                    });

                this.updateReceita(this.selectedint.id_receita, this.selectedint.quilos)
                    .then(() => { })

                g.receita_kg_max = g.receita_kg_max - this.selectedint.quilos;

                if (g.receita_kg_max <= 0) {
                    alert("A receita acabou. Escolha outra receita!");
                    break;

                }

                g.quantidade_atual += quant_int;
                g.id_intervencao += 1;
            }
            this.getReceitas();
            this.getIntervencoes();
        },
        getguia: function (id) {
            for (var i = 0; i < this.bdata.length; i++) {
                if (this.bdata[i].id == id) {
                    return this.bdata[i];
                }
            }
        },
        print: function () {


            print_info = [];
            for (var i = this.bdintervencao.length - 1; i >= 0; i--) {

                //duplica data para poder modificar
                var temp_int = Object.assign({}, this.bdintervencao[i]);

                if (this.tipoimpressao == 'guia') {
                    if (this.print_guia != temp_int.id_guia && this.print_guia != "") { continue; }
                }
                else if (this.tipoimpressao == 'int') {
                    if ((temp_int.id_intervencao < this.print_int_ini && this.print_int_ini != "") || (temp_int.id_intervencao > this.print_int_fin && this.print_int_fin != "")) {
                        continue;
                    }
                }
                var temp_guia = this.getguia(temp_int.id_guia);

                if (temp_int.id_intervencao.toString().length == 1) {
                    temp_int.id_intervencao = "00" + temp_int.id_intervencao;
                }
                else if (temp_int.id_intervencao.toString().length == 2) {
                    temp_int.id_intervencao = "0" + temp_int.id_intervencao;
                }
                temp_int.n_transporte = temp_guia.n_transporte;
                temp_int.nome_transporte = temp_guia.nome_transporte;

                temp_int.cliente_nome = this.bdencomenda.cliente_nome;
                temp_int.cliente_po = this.bdencomenda.cliente_po;
                temp_int.ordem_int = this.bdencomenda.ordem_int;
                temp_int.composicao = this.bdencomenda.composicao;
                temp_int.descricao = this.bdencomenda.descricao;
                temp_int.peso_peca = this.bdencomenda.peso_peca;

                print_info.push(temp_int);
            }
            sendCommandToWorker(print_info);
        },
        changeccordion: function (id) {
            if (this.accordion == id) {
                this.accordion = '';
            }
            else {
                this.accordion = id;
            }
        },
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
        resetSelected: function () {
            this.selected.n_transporte = '';
            this.selected.id_encomenda = '';
            this.selected.quantidade_guia = '';
            this.selected.id = '';
            this.selected.nome_transporte = '';

            this.resetSelectedint();
        },
        resetSelectedint: function () {
            this.selectedint.id = '';
            this.selectedint.id_intervencao = '';
            this.selectedint.quantidade_int = '';
            this.selectedint.quilos = '';
            this.selectedint.id_maquina_lavar = '';
            this.selectedint.id_maquina_secar = '';
            this.selectedint.data = '';
            this.selectedint.ph = '';
            this.selectedint.id_guia = '';
            this.selectedint.id_receita = '';
            this.selectedint.numero_receita = '';
        },
        ifInArray: function (value) {
            var len = this.receitas.length;
            if (value == '') {
                return false;
            }
            for (var i = 0; i < len; i++) {
                if (this.receitas[i].id == value) {
                    return false;
                }
            }
            return true;
        },
        getAllData: function () {
            this.bdata = '';
            this.bdintervencao = '';
            knex('Guia').select().where('id_encomenda', id).orderBy('Guia.n_transporte', 'desc')
                .then((rows) => {
                    if (rows.length > 0)
                        this.bdata = rows;
                });
            knex('Maquinas').select().where('status', 1)
                .then((rows) => {
                    this.mlavar = []
                    this.msecar = []
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].tipo == 1)
                            this.mlavar.push(rows[i]);
                        if (rows[i].tipo == 2)
                            this.msecar.push(rows[i]);
                    }
                });
            this.getReceitas();
            knex('Encomenda').select().where('id', id)
                .then((row) => {
                    if (row.length > 0)
                        this.bdencomenda = row[0];
                });
            this.getIntervencoes();
        },
        getReceitas: function () {
            knex('Receitas').select().where('kg', '>', 0)
                .then((rows) => {
                    this.receitas = rows;
                });
        },
        getIntervencoes: function () {
            knex.select('Intervencao.id', 'Intervencao.id_intervencao', 'Intervencao.quantidade_int', 'Intervencao.quilos', 'Intervencao.id_maquina_lavar', 'Intervencao.id_maquina_secar', 'Intervencao.data'
                , 'Intervencao.ph', 'Intervencao.id_guia', 'Intervencao.id_receita', { numero_receita: 'Receitas.numero' })
                .from('Intervencao')
                .leftJoin('Receitas', function () {
                    this.on('Receitas.id', '=', 'Intervencao.id_receita')
                })
                .innerJoin('Guia', function () {
                    this.on('Guia.id_encomenda', knex.raw('?', [id])).andOn('Guia.id', 'Intervencao.id_guia')
                }).orderBy('Intervencao.id_intervencao', 'desc')
                .then((rows) => {
                    this.bdintervencao = rows;
                })
        },

        editIntervencao: function (row) {
            this.selectedint.id = row.id
            this.selectedint.id_intervencao = row.id_intervencao
            this.selectedint.quantidade_int = row.quantidade_int
            this.selectedint.quilos = row.quilos
            this.selectedint.id_maquina_lavar = row.id_maquina_lavar
            this.selectedint.id_maquina_secar = row.id_maquina_secar
            this.selectedint.data = row.data
            this.selectedint.ph = row.ph
            this.selectedint.id_guia = row.id_guia
            this.selectedint.id_receita = row.id_receita
            this.selectedint.numero_receita = row.numero_receita
        },

        saveIntervencao: function () {
            if (this.selectedint.id != '') {

                this.updateIntervencao()
                    .then(
                        () => {
                            for (var i = 0; i < this.bdintervencao.length; i++) {
                                if (this.selectedint.id == this.bdintervencao[i].id && this.selectedint.id_receita != this.bdintervencao[i].id_receita) {
                                    this.updateReceita(this.selectedint.id_receita, this.selectedint.quilos)
                                        .then(
                                            () => {
                                                this.getReceitas();
                                            }
                                        )
                                        .catch(function (e) {
                                            console.log("Erro na funcao updateReceita.");
                                        });
                                }
                            }
                            this.getIntervencoes();
                            this.resetSelectedint();
                        }
                    ).catch(function (e) {
                        console.log("Erro: " + e);
                    });
            }
            else {
                this.addIntervencao()
                    .then(
                        () => {

                            this.updateReceita(this.selectedint.id_receita, this.selectedint.quilos)
                                .then(
                                    () => {
                                        this.getReceitas();
                                        this.getIntervencoes();
                                        this.resetSelectedint();
                                    }
                                )
                                .catch(function (e) {
                                    console.log("Erro na funcao updateReceita.");
                                });
                        }
                    )
                    .catch(function (e) {
                        console.log("Erro: " + e);
                    });
            }
        },
        updateReceita: function (id, kg) {
            return knex('Receitas').where('id', '=', id).decrement('kg', kg)
        },
        updateIntervencao: function () {
            return knex('Intervencao').where('id', '=', this.selectedint.id).update({
                id_intervencao: this.selectedint.id_intervencao,
                quantidade_int: this.selectedint.quantidade_int,
                quilos: this.selectedint.quilos,
                id_maquina_lavar: this.selectedint.id_maquina_lavar,
                id_maquina_secar: this.selectedint.id_maquina_secar,
                data: this.selectedint.data,
                ph: this.selectedint.ph,
                id_guia: this.selectedint.id_guia,
                id_receita: this.selectedint.id_receita
            })
        },
        addIntervencao: function () {
            return knex('Intervencao').insert({
                id_intervencao: this.selectedint.id_intervencao,
                quantidade_int: this.selectedint.quantidade_int,
                quilos: this.selectedint.quilos,
                id_maquina_lavar: this.selectedint.id_maquina_lavar,
                id_maquina_secar: this.selectedint.id_maquina_secar,
                data: this.selectedint.data,
                ph: this.selectedint.ph,
                id_guia: this.selected.id,
                id_receita: this.selectedint.id_receita
            })
        },
        removeIntervencao: function () {
            knex('Intervencao').where('id', '=', this.selectedint.id).del()
                .then((rows) => {
                    this.getIntervencoes();
                    this.resetSelectedint();
                })
        },
        editGuia: function (row) {
            this.selected.n_transporte = row.n_transporte;
            this.selected.id_encomenda = row.id_encomenda;
            this.selected.quantidade_guia = row.quantidade_guia;
            this.selected.id = row.id;
            this.selected.nome_transporte = row.nome_transporte;
        },
        saveGuia: function () {
            if (this.selected.id != '') {
                this.updateGuia()
                    .then(
                        () => {
                            this.getAllData();

                            this.resetSelected();
                        }
                    ).catch(function (e) {
                        console.log("Erro: " + e);
                    });
            }
            else {
                this.addGuia()
                    .then(
                        () => {
                            this.getAllData();

                            this.resetSelected();
                        }
                    )
                    .catch(function (e) {
                        console.log("Erro: " + e);
                    });
            }
        },
        updateGuia: function () {
            return knex('Guia').where('id', '=', this.selected.id).update({
                n_transporte: this.selected.n_transporte,
                nome_transporte: this.selected.nome_transporte,
                id_encomenda: this.selected.id_encomenda,
                quantidade_guia: this.selected.quantidade_guia
            })
        },
        addGuia: function () {
            return knex('Guia').insert({
                n_transporte: this.selected.n_transporte,
                nome_transporte: this.selected.nome_transporte,
                id_encomenda: this.bdencomenda.id,
                quantidade_guia: this.selected.quantidade_guia
            })
        },
        removeGuia: function () {
            knex('Guia').where('id', '=', this.selected.id).del()
                .then((rows) => {
                    this.getAllData();
                    this.resetSelected();
                })
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