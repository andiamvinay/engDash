// ==UserScript==
// @name         Reporting on HI
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Reporting on HI
// @author       You
// @match        https://support.servicenow.com/*dashboard*
// @icon         https://www.google.com/s2/favicons?domain=servicenow.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.5.1/chart.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.0.0/chartjs-plugin-datalabels.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.3.2/html2canvas.min.js
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    $j(document).ready(function() {
        //###################################
        //Add Button to switch to report view
        //###################################
        var zNode = document.createElement('div');
        zNode.innerHTML = '<button id="switch_to_report_view" type="button" style="display:none">' + 'Switch to Report</button>';
        $j('.sn-canvas-nav-buttons').parent().append(zNode);
        document.getElementById("switch_to_report_view").addEventListener("click", ButtonClickAction, false);
        // Enable only for managers
        if(window.NOW.user.allRoles.includes("sn_customerservice_manager")){
            document.getElementById("switch_to_report_view").style.display = '';
        }
        function ButtonClickAction(zEvent) {
            $j('.sn-canvas-left').hide();
            $j('.sn-canvas-right').hide();
            $j('.icon-cards').hide();
            $j('.icon-menu').hide();
            document.getElementById("switch_to_report_view").style.display = 'none';
            formLayout();
        }

        //####################################
        //Add Date Pickers in col2 and fetch button
        //####################################
        function formLayout() {
            zNode = document.createElement('div');
            zNode.innerHTML = `
                <div class="container" id="parent-container-report">
                  <div class="row">
                      <div class="vsplit col-sm-8" id="col1">
                      <div class="header_text">Dashboard</div>
                      </div>
                      <div class="vsplit col-sm-3" id="col2">
                      </div>
                 </div>
                 <div class="row" style="display:none" id="trends-parent">
                      <div class="header_text">Trends</div>
                      <div class="vsplit col-sm-4" id="tcol1" >
                      <div id="tcol11" style="height:300px;"></div>
                      <div id="tcol12" style="height:300px;"></div>
                      <div id="tcol13" style="height:300px;"></div>
                      </div>
                      <div class="vsplit col-sm-4" id="tcol2">
                      <div id="tcol21" style="height:300px;"></div>
                      <div id="tcol22" style="height:300px;"></div>
                      <div id="tcol23" style="height:300px;"></div>
                      </div>
                      <div class="vsplit col-sm-4" id="tcol3">
                      <div id="tcol31" style="height:300px;"></div>
                      <div id="tcol32" style="height:300px;"></div>
                      <div id="tcol33" style="height:300px;"></div>
                      </div>
                 </div>
               </div>
               <style>
               .header_text{
                  font-size: 35px;
                  font-family: monospace;
                  margin-top: 20px;
                  margin-left: 40%;
                  text-decoration: overline;
               }
               .dash-body{
                    overflow: scroll;
               }
               </style>
               `;
            $j('.dash-body').append(zNode);
            zNode = document.createElement('div');
            zNode.innerHTML = `<br><br><br><br><br>`;
            zNode.innerHTML += `<label for="start">Start date   :  </label>`;
            zNode.innerHTML += `<br>`;
            zNode.innerHTML += `<input type="date" id="start" name="start" value="">`;
            zNode.innerHTML += `<br><br>`;
            zNode.innerHTML += `<label for="start">End date    :  </label>`
            zNode.innerHTML += `<br>`;
            zNode.innerHTML += `<input type="date" id="end" name="end" value="">`;
            $j('#col2').append(zNode);
            zNode = document.createElement('div');
            zNode.innerHTML = `<br><br>`;
            zNode.innerHTML += `<label for="selected_manager">Select Manager:  </label>`;
            zNode.innerHTML += `<br>`;
            zNode.innerHTML += ` <input id="selected_manager" list="select_manager" style="width: 70%;" autocomplete="off"><datalist id="select_manager"></datalist>`;
            $j('#col2').append(zNode);
            zNode = document.createElement('div');
            zNode.innerHTML = `<br>`;
            zNode.innerHTML += `<label for="selected_engineer">Select Engineer:  </label>`;
            zNode.innerHTML += `<br>`;
            zNode.innerHTML += ` <input id="selected_engineer" list="select_engineer" style="width: 70%;" autocomplete="off"><datalist id="select_engineer"></datalist>`;
            $j('#col2').append(zNode);
            zNode = document.createElement('div');
            zNode.innerHTML = `<br><br>`;
            zNode.innerHTML += '<button id="fetch_data" type="button">' + 'Run Report</button>';
            zNode.innerHTML += '<button id="show_trends" style="display:none" type="button">' + 'Show Trend</button>';
            zNode.innerHTML += '<button id="download_file"style="display:none" type="button">' + 'Download</button>';
            $j('#col2').append(zNode);
            document.getElementById("fetch_data").addEventListener("click", fetchData, false);
            document.getElementById("show_trends").addEventListener("click", showTrends, false);
            document.getElementById("download_file").addEventListener("click", takeScreenshot, false);


            //####################################
            //Take Screenshot
            //####################################
            function takeScreenshot() {
                var selectedEngineer = $j('#selected_engineer').val();
                var file_name;
                if (selectedEngineer) {
                    file_name = selectedEngineer.trim() + ".png";
                } else {
                    file_name = "file-name.png"
                }
                html2canvas(document.getElementById('parent-container-report')).then(function(canvas) {
                    saveAs(canvas.toDataURL(), file_name);
                });
                function saveAs(uri, filename) {
                    var link = document.createElement('a');
                    if (typeof link.download === 'string') {
                        link.href = uri;
                        link.download = filename;
                        //Firefox requires the link to be in the body
                        document.body.appendChild(link);
                        //simulate click
                        link.click();
                        //remove the link when done
                        document.body.removeChild(link);
                    } else {
                        window.open(uri);
                    }
                }
            }
            //####################################
            //Get Managers and engineers;
            //####################################
            getManagers();
            $j('#selected_manager').click(function() {
                $j('#selected_manager').val("");
            });
            $j('#selected_engineer').click(function() {
                $j('#selected_engineer').val("");
            });
            $j('#selected_manager').change(function() {
                var value = $j('#selected_manager').val();
                var manager_sys_id = $j('#select_manager [value="' + value + '"]').data('value').trim();
                $j("#selected_engineer").val("")
                getEngineers(manager_sys_id);
            });

            //####################################
            //Set Loading for the case containers
            //####################################
            function setLoading() {
                $j('#total_closed').text("...");
                $j('#total_assigned').text("...");
                $j('#48_closed').text("...");
                $j('#48_closed_precentage').text("...");
                $j('#csat').text("...");
                $j('#ttr').text("...");
                $j('#kb_external').text("...");
                $j('#kb_internal').text("...");
                $j('#attach_rate').text("...");
                $j('#tasks_handled').text("...");
                $j('#escalations').text("...");
                $j('#sol_rejected').text("...");
            };

            //####################################
            //Run Report/fetch Data
            //####################################

            function fetchData() {
                console.log("Button Clicked");
                var selectedManager = $j('#selected_manager').val();
                var selectedEngineer = $j('#selected_engineer').val();
                var start_date = $j('#start').val();
                var end_date = $j('#end').val();
                if (selectedManager && selectedEngineer && start_date && end_date) {
                    var value = $j('#selected_engineer').val();
                    var engineer_sys_id = $j('#select_engineer [value="' + value + '"]').data('value').trim();
                    setLoading();
                    getTotalAssigned(engineer_sys_id);
                    getTotalClosed(engineer_sys_id);
                    getEngineerCSAT(engineer_sys_id);
                    getEngineerTTR(engineer_sys_id);
                    getEngineerKBI(engineer_sys_id);
                    getEngineerKBE(engineer_sys_id);
                    getEngTasksHandled(engineer_sys_id);
                    getEngEscalations(engineer_sys_id);
                    getEngSolutionRejected(engineer_sys_id);
                    //$j("#download_file").show();

                } else {
                    alert("Select Start Date, End Date, Mananger and Engineer");
                }
            }
            //####################################
            //Add Containers [First 4]
            //####################################
            zNode = document.createElement('div');
            zNode.innerHTML = `
                <div class="container" id="case-containter1" style="padding-top: 5%">
                  <div class="row">
                    <div class="vsplit col-sm-2" id="col11">
                      <div class="sn-canvas-header-tools custom_header"><p">Total Assigned</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="total_assigned" class="count_val"></p></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col12">
                      <div class="sn-canvas-header-tools custom_header"><p>Total Closed</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="total_closed" class="count_val"></p></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col13">
                      <div class="sn-canvas-header-tools custom_header"><p>48 Hours</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="48_closed" class="count_val"></p></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col14">
                      <div class="sn-canvas-header-tools custom_header"><p>48 Hours %</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="48_closed_precentage" class="count_val"></p></div>
                    </div>
                  </div>
                </div>
                <style>
                .count_val{
                    height: 100px;
                    line-height: 100px;
                    font-size: 50px;
                 }
                </style>
                `;
            $j('#col1').append(zNode);
            //####################################
            //Add Containers[Second 4]
            //####################################
            zNode = document.createElement('div');
            zNode.innerHTML = `
                <div class="container" id="case-containter2" style="padding-top: 5%">
                  <div class="row">
                    <div class="vsplit col-sm-2" id="col21">
                      <div class="sn-canvas-header-tools custom_header" ><p>CSAT</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="csat" class="count_val"></p><span id="csat_count"></span></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col22">
                      <div class="sn-canvas-header-tools custom_header"><p>TTR</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="ttr" class="count_val"></p></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col23">
                      <div class="sn-canvas-header-tools custom_header"><p>KB External</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="kb_external" class="count_val"></p></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col24">
                      <div class="sn-canvas-header-tools custom_header"><p>KB Internal</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="kb_internal" class="count_val"></p></div>
                    </div>
                  </div>
                </div>
                <style>
                .count_val{
                    height: 100px;
                    line-height: 100px;
                    font-size: 50px;
                 }
                </style>
                `;
            $j('#col1').append(zNode);
            //####################################
            //Add Containers[Third 4]
            //####################################
            zNode = document.createElement('div');
            zNode.innerHTML = `
                <div class="container" id="case-containter3" style="padding-top: 5%">
                  <div class="row">
                    <div class="vsplit col-sm-2" id="col21">
                      <div class="sn-canvas-header-tools custom_header"><p>Attach Rate</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="attach_rate" class="count_val"></p></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col22">
                      <div class="sn-canvas-header-tools custom_header" ><p>Tasks Handled</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="tasks_handled" class="count_val"></p></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col23">
                      <div class="sn-canvas-header-tools custom_header" ><p>Escalations</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="escalations" class="count_val"></p></div>
                    </div>
                    <div class="vsplit col-sm-2" id="col24">
                      <div class="sn-canvas-header-tools custom_header" ><p>Solution Rejected</p></div>
                      <div class="sn-canvas-header-tools" style="height: 100px;justify-content: center !IMPORTANT;"><p id="sol_rejected" class="count_val"></p></div>
                    </div>
                  </div>
                </div>
                <style>
                .count_val{
                    height: 100px;
                    line-height: 100px;
                    font-size: 50px;
                 }
                .custom_header{
                    height: 1px;
                    background-color: #80B6A1;
                    justify-content: center !IMPORTANT;
                    font-size: 16px;
                 }
                </style>
                `;
            $j('#col1').append(zNode);
            //####################################
            //Generic Send Request Function
            //####################################
            function sendRequest(table_name, sysparm_fields, sysparm_query) {
                var endpoint = "https://support.servicenow.com" + "/api/now/table/" + table_name + "?";
                endpoint += "sysparm_query=" + sysparm_query + "&";
                endpoint += "sysparm_fields=" + sysparm_fields + "&";
                var client = new XMLHttpRequest();
                client.open("get", endpoint);
                client.setRequestHeader('Accept', 'application/json');
                client.setRequestHeader('Content-Type', 'application/json');
                client.setRequestHeader('X-UserToken', window.g_ck);
                return client;
            };
            //####################################
            //Get Support Managers
            //####################################
            function getManagers() {
                const logged_in_user_sysid = window.NOW.user.userID;
                $j('#selected_manager').val("..Loading");
                $j("#selected_manager").prop('disabled', true);
                $j("#selected_engineer").prop('disabled', true);
                var table_name = "sys_user";
                var sysparm_fields = "sys_id,name";
                var sysparm_query = `active=true^u_mgmt_level1=${logged_in_user_sysid}
                ^ORu_mgmt_level2=${logged_in_user_sysid}^ORu_mgmt_level3=${logged_in_user_sysid}
                ^ORu_mgmt_level4=${logged_in_user_sysid}^ORu_mgmt_level5=${logged_in_user_sysid}
                ^ORu_mgmt_level6=${logged_in_user_sysid}^ORu_mgmt_level7=${logged_in_user_sysid}
                ^ORmanager=${logged_in_user_sysid}^titleNOT LIKEengineer^titleNOT LIKEResource
                ^titleNOT LIKERepresentative^titleNOT LIKEIntern^titleNOT LIKESupport Rep^NQsys_id=${logged_in_user_sysid}^ORDERBYname`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var managers = JSON.parse(this.response).result;
                        managers.forEach((manager) => {
                            $j('#select_manager').append(` <option data-value="${manager.sys_id}" value="${manager.name}"></option>`);
                        });
                        $j('#selected_manager').val("");
                        $j("#selected_manager").prop('disabled', false);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get Engineers
            //####################################
            function getEngineers(manager_sys_id) {
                $j("#select_engineer").html('');
                $j("#selected_engineer").val("..Loading");
                $j("#selected_engineer").prop('disabled', true);
                if (!manager_sys_id) {
                    return;
                }
                var table_name = "sys_user";
                var sysparm_fields = "sys_id,name";
                var sysparm_query = `active=true^department=3a5c578adb99bf44fec4fb2439961984^ORdepartment=66e0413cdb836cd04fee66f748961927^manager=${manager_sys_id}`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var engineers = JSON.parse(this.response).result;
                        engineers.forEach((engineer) => {
                            $j('#select_engineer').append(` <option data-value="${engineer.sys_id}" value="${engineer.name}"></option>`);
                        });
                        $j("#selected_engineer").val("");
                        $j("#selected_engineer").prop('disabled', false);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get total assigned for engineer
            //####################################
            function getTotalAssigned(engineer_sys_id) {
                var table_name = "sn_customerservice_case";
                var sysparm_fields = "number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `assigned_to=${engineer_sys_id}^assigned_onBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var value = JSON.parse(this.response).result.length;
                        $j('#total_assigned').text(value)
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get total closed for engineer
            //####################################
            function getTotalClosed(engineer_sys_id) {
                var table_name = "sn_customerservice_case";
                var sysparm_fields = "number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `assigned_to=${engineer_sys_id}^closed_atBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var value = JSON.parse(this.response).result.length;
                        $j('#total_closed').text(value)
                        get48HoursClosed(engineer_sys_id);
                        getEngAttachRate(engineer_sys_id);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get total 48 hours closed for engineer
            //####################################
            function get48HoursClosed(engineer_sys_id) {
                var table_name = "sn_customerservice_case";
                var sysparm_fields = "number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `assigned_to=${engineer_sys_id}^closed_atBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')
                ^resolved_atLESSTHANopened_at@hour@after@48`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var value = JSON.parse(this.response).result.length;
                        $j('#48_closed').text(value);
                        var closed_48 = parseInt($j('#48_closed').text());
                        var closed = parseInt($j('#total_closed').text());
                        var percent_48 = ((closed_48 / closed) * 100).toFixed(2);
                        $j('#48_closed_precentage').text(closed_48 > 0 ? percent_48 : 0);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get avg CSAT for engineer
            //####################################
            function getEngineerCSAT(engineer_sys_id) {
                var table_name = "task_assessment_detail";
                var sysparm_fields = "metricres_string_value";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `task_assigned_to=${engineer_sys_id}^asmtins_taken_onBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')
                ^metricres_instance_question.metric.questionLIKEOverall Support Experience`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var csatArray = JSON.parse(this.response).result;
                        var csatVal = 0;
                        csatArray.forEach((csat) => {
                            csatVal = csatVal + parseInt(csat.metricres_string_value.split('=')[0].trim());
                        });
                        $j('#csat').text(csatArray.length > 0 ? (csatVal / csatArray.length).toFixed(2) : 0);
                        $j('#csat_count').text(`#${csatArray.length}`);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get TTR for the engineer
            //####################################
            function getEngineerTTR(engineer_sys_id) {
                var table_name = "sn_customerservice_case";
                var sysparm_fields = "opened_at,resolved_at";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `assigned_to=${engineer_sys_id}^closed_atBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var ttrarray = JSON.parse(this.response).result;
                        var trrDiffArray = [];
                        var ttrSeconds = 0;
                        ttrarray.forEach((record) => {
                            trrDiffArray.push((new Date(record.resolved_at) - new Date(record.opened_at)) / 1000);
                        });
                        trrDiffArray.sort(function(a, b) {
                            return a - b
                        });
                        var mid = Math.floor(trrDiffArray.length / 2);
                        var median = trrDiffArray.length % 2 !== 0 ? trrDiffArray[mid] : (trrDiffArray[mid - 1] + trrDiffArray[mid]) / 2;
                        $j('#ttr').text(ttrarray.length > 0 ? (median / (60 * 60 * 24)).toFixed(2) : 0);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get KB Internal for the engineer
            //####################################
            function getEngineerKBI(engineer_sys_id) {
                var table_name = "kb_knowledge";
                var sysparm_fields = "number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `author=${engineer_sys_id}^u_kb_audience=27a515ba7bb63400ff53c5ee4a4d4d2a^ORu_kb_audience=bef6d1727bf63400ff53c5ee4a4d4d43
                ^publishedBETWEENjavascript:gs.dateGenerate('${startDate}','start')@javascript:gs.dateGenerate('${endDate}','end')
                ^kb_knowledge_base=124c2ca22bb9f1002f42729fe8da152e^ORkb_knowledge_base=a5f38d0b2be931002f42729fe8da1594^workflow_state=published^version.versionSTARTSWITH1.0`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var kbIarr = JSON.parse(this.response).result.length;
                        $j('#kb_internal').text(`  ${kbIarr}`);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get KB External for the engineer
            //####################################
            function getEngineerKBE(engineer_sys_id) {
                var table_name = "kb_knowledge";
                var sysparm_fields = "number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `author=${engineer_sys_id}^u_kb_audience=cb5fc5c06ff3d10016140e9c5d3ee4ec^ORu_kb_audience=4b0819b67bb63400ff53c5ee4a4d4d1f
                ^publishedBETWEENjavascript:gs.dateGenerate('${startDate}','start')@javascript:gs.dateGenerate('${endDate}','end')
                ^kb_knowledge_base=124c2ca22bb9f1002f42729fe8da152e^ORkb_knowledge_base=a5f38d0b2be931002f42729fe8da1594^workflow_state=published^version.versionSTARTSWITH1.0`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var kbEarr = JSON.parse(this.response).result.length;
                        $j('#kb_external').text(kbEarr);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get Attach Rate for the engineer[Called from TotalClosed]
            //####################################
            function getEngAttachRate(engineer_sys_id) {
                var table_name = "sn_customerservice_case";
                var sysparm_fields = "number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `knowledge=true^assigned_to=${engineer_sys_id}^closed_atBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var closedCases = parseInt($j('#total_closed').text());
                        var attachLength = JSON.parse(this.response).result.length;
                        $j('#attach_rate').text(closedCases > 0 ? ((attachLength / closedCases) * 100).toFixed(2) : 0);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get Tasks Handled for the engineer
            //####################################
            function getEngTasksHandled(engineer_sys_id) {
                var table_name = "sn_customerservice_task";
                var sysparm_fields = "number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `closed_atBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')
                ^assignment_group=ef170758584120006863f2dea01f7f1c^assigned_to=${engineer_sys_id}^short_descriptionNOT LIKEHOP`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var tasksHandled = JSON.parse(this.response).result.length;
                        $j('#tasks_handled').text(tasksHandled);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get Escalations for the engineer
            //####################################
            function getEngEscalations(engineer_sys_id) {
                var table_name = "u_case_escalation";
                var sysparm_fields = "number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `cs_assigned_to=${engineer_sys_id}^escl_sys_created_onBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var escalations = JSON.parse(this.response).result.length;
                        $j('#escalations').text(escalations);
                    }
                }
                xmlhttpReq.send();
            };
            //####################################
            //Get Solution Rejected for the engineer
            //####################################
            function getEngSolutionRejected(engineer_sys_id) {
                var table_name = "u_case_history";
                var sysparm_fields = "cs_number";
                var startDate = $j('#start').val();
                var endDate = $j('#end').val();
                var sysparm_query = `jour_sys_created_onBETWEENjavascript:gs.dateGenerate('${startDate}','00:00:00')@javascript:gs.dateGenerate('${endDate}','23:59:59')
                ^jour_valueSTARTSWITHSolution rejected^cs_assigned_to=${engineer_sys_id}`;
                var xmlhttpReq = sendRequest(table_name, sysparm_fields, sysparm_query);
                xmlhttpReq.onreadystatechange = function() {
                    if (this.readyState == this.DONE) {
                        var kbEarr = JSON.parse(this.response).result.length;
                        $j('#sol_rejected').text(kbEarr);
                    }
                }
                xmlhttpReq.send();
            };
        } //FORM LAYOUT END
        //################################################################################################################################
        //####################################
        //CHARTING / TRENDS
        //####################################
        //################################################################################################################################
        async function showTrends() {
            document.getElementById("trends-parent").style.display = "";
            var zNode = document.createElement('div');
            zNode.innerHTML = `<style>.lds-roller {
  display: inline-block;
  position: relative;
  width: 300px;
  height: 300px;
  background: #80B6A1;
}
.lds-roller div {
  animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  transform-origin: 40px 40px;
}
.lds-roller div:after {
  content: " ";
  display: block;
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  margin: -4px 0 0 -4px;
}
.lds-roller div:nth-child(1) {
  animation-delay: -0.036s;
}
.lds-roller div:nth-child(1):after {
  top: 63px;
  left: 63px;
}
.lds-roller div:nth-child(2) {
  animation-delay: -0.072s;
}
.lds-roller div:nth-child(2):after {
  top: 68px;
  left: 56px;
}
.lds-roller div:nth-child(3) {
  animation-delay: -0.108s;
}
.lds-roller div:nth-child(3):after {
  top: 71px;
  left: 48px;
}
.lds-roller div:nth-child(4) {
  animation-delay: -0.144s;
}
.lds-roller div:nth-child(4):after {
  top: 72px;
  left: 40px;
}
.lds-roller div:nth-child(5) {
  animation-delay: -0.18s;
}
.lds-roller div:nth-child(5):after {
  top: 71px;
  left: 32px;
}
.lds-roller div:nth-child(6) {
  animation-delay: -0.216s;
}
.lds-roller div:nth-child(6):after {
  top: 68px;
  left: 24px;
}
.lds-roller div:nth-child(7) {
  animation-delay: -0.252s;
}
.lds-roller div:nth-child(7):after {
  top: 63px;
  left: 17px;
}
.lds-roller div:nth-child(8) {
  animation-delay: -0.288s;
}
.lds-roller div:nth-child(8):after {
  top: 56px;
  left: 12px;
}
@keyframes lds-roller {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}</style>`
            $j('#trends-parent').append(zNode);
            if ($j("canvas#closed_at_month").length > 0) {
                $j("canvas#closed_at_month").remove();
            }
            if ($j("canvas#assigned_at_month").length > 0) {
                $j("canvas#assigned_at_month").remove();
            }
            if ($j("canvas#48_hours_percent").length > 0) {
                $j("canvas#48_hours_percent").remove();
            }
            let a = await getTrendByMonthData('assigned_on', 'tcol11', "number", "sn_customerservice_case", "assigned_on");
            let b = await getTrendByMonthData('closed_at', 'tcol21', "number", "sn_customerservice_case", "closed_at");
            let c = await getTrendByMonthData('48hour', 'tcol31', "number", "sn_customerservice_case", "48hour");

        }
        //####################################
        //getData AJAX
        //####################################
        function getData(table_name, sysparm_query, sysparm_fields) {
            var endpoint = "https://support.servicenow.com" + "/api/now/table/" + table_name + "?";
            endpoint += "sysparm_query=" + sysparm_query + "&";
            endpoint += "sysparm_fields=" + sysparm_fields + "&";
            return $j.ajax({
                url: endpoint,
                type: 'GET',
                beforeSend: function(request) {
                    request.setRequestHeader('Accept', 'application/json');
                    request.setRequestHeader('Content-Type', 'application/json');
                    request.setRequestHeader('X-UserToken', window.g_ck);;
                },
            });
        };

        //####################################
        //get last 12 months
        //####################################
        function getLastLast12Months() {
            var last12Months = new Map();
            var today = new Date();
            var date;
            var month;
            var year;
            var lastDate;
            for (var i = 11; i >= 0; i -= 1) {
                date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                month = date.getMonth() + 1;
                year = date.getFullYear();
                lastDate = new Date(year, month, 0).getDate();
                month = String(month).length == 1 ? `0${month}` : month;
                last12Months.set(`${year}-${month}-01`, `${year}-${month}-${lastDate}`)
            }
            return last12Months;
        };
        //####################################
        //getTrendByMonthData
        //####################################
        async function getTrendByMonthData(trendType, colVal, fields, table, date_field) {
            var loaderDiv = `<div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>`;
            $j(`#${colVal}`).append(loaderDiv);
            var resultsMap = new Map();
            const table_name = table;
            let engineer = $j('#selected_engineer').val();
            let engineer_sys_id = $j('#select_engineer [value="' + engineer + '"]').data('value').trim();
            const sysparm_fields = fields;
            let sysparm_query;
            try {
                for (let [key, value] of getLastLast12Months()) {
                    if (trendType == "48hour") {
                        sysparm_query = `assigned_to=${engineer_sys_id}
                    ^closed_atBETWEENjavascript:gs.dateGenerate('${key}','00:00:00')
                    @javascript:gs.dateGenerate('${value}','23:59:59')
                    ^resolved_atLESSTHANopened_at@hour@after@48`;
                    } else {
                        sysparm_query = `assigned_to=${engineer_sys_id}^${date_field}BETWEENjavascript:gs.dateGenerate('${key}','00:00:00')@javascript:gs.dateGenerate('${value}','23:59:59')`;
                    }
                    var res = await getData(table_name, sysparm_query, sysparm_fields)
                    resultsMap.set(key, res.result.length);
                }
                if (trendType == "closed_at") {
                    addChart(resultsMap, 'Closed Last 12 months', 'closed_at_month', colVal);
                    return
                } else if (trendType == "assigned_on") {
                    addChart(resultsMap, 'Assigned in Last 12 months', 'assigned_at_month', colVal);
                    return
                } else if (trendType == "48hour") {
                    let closedAt = Chart.getChart("closed_at_month").data.datasets[0].data;
                    let f8hours = [...resultsMap.values()];
                    var f8CentMap = new Map();
                    var i = 0;
                    for (let [key, value] of resultsMap) {
                        f8CentMap.set(key, parseFloat(((f8hours[i] / closedAt[i]) * 100).toFixed(2)));
                        i = i + 1;
                    }
                    console.log(f8CentMap);
                    addChart(f8CentMap, '48 hours%', '48_hours_percent', colVal);
                    return;
                } else if (trendType == "ttr") {

                };
            } catch (err) {
                console.log(err);
            }
        };
        //####################################
        //Draw chart bt Data and title
        //####################################
        function addChart(resultsMap, title, id, colVal) {
            $j(`#${colVal}`).children()[0].remove()
            var zNode = document.createElement('div');
            zNode.innerHTML = `<div style="height:300px"><canvas id="${id}"></canvas></div>`;
            $j(`#${colVal}`).append(zNode);
            let labels = [];
            let countData = [];
            for (let [key, value] of resultsMap) {
                labels.push(key);
                countData.push(value);
            }
            const data = {
                labels: labels,
                datasets: [{
                    label: title,
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: countData,
                }]
            };
            const config = {
                type: 'line',
                data: data,
                //plugins: [ChartDataLabels],
                options: {
                    maintainAspectRatio: false,
                    /* plugins: {
      // Change options for ALL labels of THIS CHART
      datalabels: {
        color: '#36A2EB',
        anchor : 'start',
          align:'top',
          clamp :'true'
      }
    }*/
                }
            };
            var myChart = new Chart(
                document.getElementById(id),
                config
            );
        }
    });
})();