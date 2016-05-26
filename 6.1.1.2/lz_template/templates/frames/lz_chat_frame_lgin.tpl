<!DOCTYPE html>
<!--html-->
<head>
	<META NAME="robots" CONTENT="noindex,follow">
	<title><!--config_gl_site_name--></title>
	<link rel="stylesheet" type="text/css" href="./templates/style_chat.min.css">
</head>
<body style="padding:0;margin:0;overflow:hidden;">
	<!--alert-->
	<div id="lz_chat_loading">
        <div style="position:relative;top:40%;color:#ababab;">
            <div class="lz_anim_loading"></div>
        </div>
    </div>
	<!--errors-->
    <!--header-->
    <div id="lz_chat_navigation">
        <table>
            <tr>
                <td>
                    <ul id="lz_chat_navigation_tabs">
                        <li id="lz_tab_chat" class="lz_chat_navigation_tab" style="width:120px;" onclick="parent.lz_chat_tab_set_active('chat',true);">
                            <div><span><!--lang_client_tab_chat--></span></div>
                        </li>
                        <li id="lz_tab_callback" class="lz_chat_navigation_tab" onclick="parent.lz_chat_tab_set_active('callback',true);">
                            <div><span><!--lang_client_tab_callback--></span></div>
                        </li>
                        <li id="lz_tab_ticket" class="lz_chat_navigation_tab" style="width:165px;" onclick="parent.lz_chat_tab_set_active('ticket',true);">
                            <div><span><!--lang_client_tab_ticket--></span></div>
                        </li>
                        <li id="lz_tab_knowledgebase" class="lz_chat_navigation_tab" style="width:160px;" onclick="parent.lz_chat_tab_set_active('knowledgebase',true);">
                            <div>
                                <span>
                                    <!--lang_client_tab_knowledgebase-->
                                    <span id="lz_chat_kb_icon"></span>
                                </span>
                            </div>
                        </li>
                    </ul>
                </td>
            </tr>
        </table>
    </div>
    <div id="lz_input_header_box" class="lz_input_header">
        <table style="height:100%;">
            <tr>
                <td style="width:5px;"></td>
                <td style="vertical-align:top;" id="lz_header_type_icon">
                    <img id="lz_header_icon_operator_close" src="./images/icon_close.png"  alt="" onclick="parent.lz_chat_unset_operator();">
                    <img id="lz_header_icon_operator" src=""  alt="">
                </td>
                <td style="vertical-align:middle;padding-right:10px;">
                    <span id="lz_header_title"></span><br>
                    <span id="lz_form_info_field"></span>
                </td>
                <td></td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_knowledgebase" onscroll="parent.lz_chat_kb_scroll(this);" class="lz_chat_module">
        <table style="width:100%;max-width:1000px;margin: auto auto;">
            <tr>
                <td>
                    <br>
                    <table style="width:100%;">
                        <tr>
                            <td style="width:35px;"></td>
                            <td style="width:auto;white-space:nowrap;text-wrap:none;text-align:center;vertical-align:middle;">
                                <!--kb_header-->
                                <input id="lz_chat_kb_input" class="lz_form_base lz_form_box" style="box-shadow:none;" placeholder="<!--lang_client_kb_search_placeholder-->" onkeyup="if(event.keyCode==13){parent.lz_chat_init_search_kb(true,false);}else if(event.keyCode==8 && document.getElementById('lz_chat_kb_input').value==''){parent.lz_chat_init_search_kb(true,false);}">
                                <input id="lz_chat_kb_search"type="button" class="lz_form_button unselectable" value="<!--lang_client_search-->" onclick="parent.lz_chat_init_search_kb(true,false);">
                                <input id="lz_chat_kb_reset" type="button" class="lz_form_button unselectable" onclick="document.getElementById('lz_chat_kb_input').value='';parent.lz_chat_init_search_kb(true,false);" style="display:none;">
                            </td>
                            <td style="width:35px;"></td>
                        </tr>
                    </table>
                    <br>
                </td>
            </tr>
            <tr>
                <td>
                    <br>
                    <table class="lz_input center" style="max-width:100%;">
                        <tr>
                            <td id="lz_chat_kb_results" class="lz_chat_kb_results"></td>
                        </tr>
                        <tr>
                            <td id="lz_chat_kb_external_link" style="display:none;" class="lz_chat_kb_results">
                                <br><br><!--lang_client_kb_search--><br><br><input id="lz_chat_kb_articles"type="button" class="lz_form_button unselectable" value="<!--lang_client_kb_browse-->" onclick="parent.lz_chat_open_external_kb();">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
	<div id="lz_chat_login" class="lz_chat_module">
        <form name="lz_login_form" method="post" action="./<!--file_chat-->?template=lz_chat_frame_chat<!--website-->&amp;<!--url_get_params-->" target="lz_chat_content_frame" style="padding:0px;margin:0px;">
		<table width="100%">
			<tr>
				<td style="text-align:center;vertical-align:top;">
                    <br>
                    <div id="lz_chat_ticket_success" style="display:none;"><br><!--lang_client_message_received--></div>
                    <div id="lz_form_details" style="display:none;">
						<!--chat_login_inputs-->
                        <br>
                        <table class="lz_input" style="width:100%;">
                            <tr>
                                <td style="text-align:center;">
                                    <input type="button" id="lz_action_button" class="lz_form_button" disabled>
                                    <input type="button" value="<!--lang_client_voucher_checkout-->" id="buy_voucher_button" onclick="parent.lz_chat_buy_voucher_navigate('voucher_select',false);" class="lz_form_button">
                                    <span style="display:none;" id="lz_form_mandatory" class="lz_input_icon lz_required"><!--lang_client_required_field--></span>
                                </td>
                                <td class="lz_form_icon"></td>
                            </tr>
                        </table>
					</div>
				</td>
			</tr>
		</table>
		</form>
	</div>
	<div style="position:absolute;left:20px;bottom:30px;<!--ssl_secured-->z-index:-1;">
		<img src="./images/lz_ssl_secured_chat.gif" alt="" width="123" height="45">
	</div>
	<!--com_chats-->
	<input type="hidden" name="form_chat_call_me_back">
    <div id="lz_chat_navigation_status" class="lz_chat_navigation_status_offline"></div>
    <div id="lz_chat_param"><!--param--></div>
</body>
</html>
