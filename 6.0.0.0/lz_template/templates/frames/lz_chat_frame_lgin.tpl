<!DOCTYPE html>
<!--html-->
<head>
	<META NAME="robots" CONTENT="noindex,follow">
	<title><!--config_gl_site_name--></title>
	<link rel="stylesheet" type="text/css" href="<!--server-->templates/style_chat.min.css">
</head>
<body style="padding:0;margin:0;overflow:hidden;">
	<!--alert-->
	<div id="lz_chat_loading">
        <div style="position:relative;top:40%;color:#ababab;"><!--lang_client_loading--> ...<br><br><img src="<!--server-->images/chat_loading.gif" alt=""></div>
    </div>
	<!--errors-->
    <!--header-->
    <div id="lz_chat_navigation">
        <table>
            <tr>
                <td style="width:15px;"></td>
                <td>
                    <ul class="lz_chat_navigation_tabs">
                        <li id="lz_tab_chat" class="lz_chat_navigation_tab" onclick="parent.lz_chat_tab_set_active('chat',true);">
                            <span id="lz_chat_navigation_status" class="lz_chat_navigation_status_offline"></span>
                            <span><!--lang_client_tab_chat--></span>
                        </li>
                        <li id="lz_tab_callback" class="lz_chat_navigation_tab" onclick="parent.lz_chat_tab_set_active('callback',true);">
                            <!--lang_client_tab_callback-->
                        </li>
                        <li id="lz_tab_ticket" class="lz_chat_navigation_tab" onclick="parent.lz_chat_tab_set_active('ticket',true);">
                            <!--lang_client_tab_ticket-->
                        </li>
                        <li id="lz_tab_knowledgebase" class="lz_chat_navigation_tab" onclick="parent.lz_chat_tab_set_active('knowledgebase',true);">
                            <span><!--lang_client_tab_knowledgebase--></span>
                            <div id="lz_chat_kb_icon" style="visibility:hidden"></div>
                        </li>
                    </ul>
                </td>
                <td style="width:5px;"></td>
            </tr>
        </table>
    </div>
    <div id="lz_input_header_box" class="lz_input_header">
        <table style="height:100%;">
            <tr>
                <td style="width:5px;"></td>
                <td style="vertical-align:top;" id="lz_header_type_icon">
                    <img id="lz_header_icon_operator_close" src="<!--server-->images/icon_close.png"  alt="" onclick="parent.lz_chat_unset_operator();">
                    <img id="lz_header_icon_operator" src=""  alt="">
                </td>
                <td style="vertical-align:middle;">
                    <span id="lz_header_title"></span><br>
                    <span id="lz_form_info_field"></span>
                </td>
                <td></td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_knowledgebase" onscroll="parent.lz_chat_kb_scroll(this);" class="lz_chat_module">
        <table style="width:100%;">
            <tr>
                <td>
                    <br>
                    <table style="width:100%;">
                        <tr>
                            <td style="width:35px;"></td>
                            <td style="width:auto;white-space:nowrap;text-wrap:none;text-align:center;vertical-align:middle;">
                                <input id="lz_chat_kb_input" class="lz_form_base lz_form_box" placeholder="<!--lang_client_kb_search_placeholder-->">
                                <input id="lz_chat_kb_search"type="button" class="lz_form_button unselectable" value="<!--lang_client_search-->" onclick="parent.lz_chat_init_search_kb(true,false);">
                                <input id="lz_chat_kb_reset" type="button" class="lz_form_button unselectable" onclick="document.getElementById('lz_chat_kb_input').value='';parent.lz_chat_init_search_kb(true,false);">
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
                            <td id="lz_chat_kb_results" style="padding:10px 20px;text-align:center;vertical-align:top;"></td>
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
				<td align="center" valign="top">
                    <br>
                    <div id="lz_chat_ticket_success" style="display:none;"><br><!--lang_client_message_received--></div>
                    <div id="lz_form_details" style="display:none;">
						<!--chat_login_inputs-->
						<table class="lz_input" id="lz_group_selection_box">
							<tr>
								<td class="lz_form_field"><strong><!--lang_client_group-->:</strong></td>
                                <td style="width:24px;"><div id="lz_chat_group_status" class="lz_chat_input_icon lz_chat_input_icon_online"></div></td>
								<td valign="middle">
                                    <select id="lz_form_groups" class="lz_form_box" name="intgroup" onChange="parent.lz_chat_change_group(this,true);this.blur();" onKeyUp="this.blur();" onclick="parent.lz_chat_pre_change_group(this);"></select>
                                </td>
                                <td class="lz_form_icon"></td>
                            </tr>
						</table>
                        <br>
                        <table class="lz_input" style="margin-top:15px;width:100%;">
                            <tr>
                                <td class="lz_form_field">
                                    <div style="display:none;" id="lz_form_mandatory">
                                        <table><tr><td style="vertical-align:top;"><div class="lz_input_icon lz_required"></div></td><td><span class="lz_index_help_text"><!--lang_client_required_field--></span></td></tr></table>
                                    </div>
                                </td>
                                <td>
                                    <input type="button" id="lz_action_button" class="lz_form_button" disabled>
                                    <input type="button" value="<!--lang_client_voucher_checkout-->" id="buy_voucher_button" onclick="parent.lz_chat_buy_voucher_navigate('voucher_select',false);" class="lz_form_button">
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
	<div style="position:absolute;left:20px;bottom:10px;<!--ssl_secured-->;z-index:-1;">
		<img src="<!--server-->images/lz_ssl_secured_chat.gif" alt="" width="123" height="45">
	</div>
	<!--com_chats-->
	<input type="hidden" name="form_chat_call_me_back">
    <div id="lz_chat_param"><!--param--></div>
</body>
</html>
