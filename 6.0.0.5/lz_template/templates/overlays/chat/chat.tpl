<div id="lz_chat_overlay_main" class="lz_chat_base notranslate" style="direction:<!--dir-->;border-radius:6px;background:<!--bgc-->;">
    <div id="lz_chat_waiting_messages" style="display:none;" onclick="lz_chat_change_state(true,false);">
        <div id="lz_chat_waiting_message_count" style="display:none;"></div>
    </div>
    <div style="position:absolute;top:5px;left:6px;height:25px;right:6px;z-index:100015;background:<!--bgc-->;color:<!--tc-->;">
        <div class="lz_overlay_chat_gradient" class="unselectable">
            <div id="lz_chat_overlay_text" style="color:<!--tch-->;<!--ts-->" onclick="lz_chat_change_state(true,false);" class="unselectable unmovable"></div>
            <div id="lz_chat_minimize" onclick="lz_chat_change_state(true,true);" class="unselectable unmovable">
                <div id="lz_chat_state_change" style="border-bottom:3px solid <!--tch-->;display:none;" class="unselectable"></div>
            </div>
        </div>
    </div>
    <div id="lz_chat_content" class="unmovable">
		<div class="lz_chat_content_table" class="unmovable">
            <div id="lz_chat_state_bar">
                <div id="lz_chat_menu_line" class="unselectable">
                    <span onclick="lz_chat_switch_options_table();" id="lz_chat_options_button"><!--lang_client_options--></span>
                    <span onclick="lz_chat_close();" id="lz_chat_close_button"><!--lang_client_end_chat--></span>
                </div>
                <table id="lz_chat_options_table" style="display:none" class="unselectable">
                    <tr id="lz_cf_tr" onclick="lz_chat_switch_options_table();lz_chat_switch_options('tr');" style="display:<!--tr_vis-->;"><td><!--lang_client_use_auto_translation_service_short--></td></tr>
                    <tr id="lz_cf_fu" onclick="lz_chat_switch_options_table();lz_chat_switch_options('fu');"><td><!--lang_client_send_file--></td></tr>
                    <tr id="lz_cf_so" onclick="lz_chat_switch_options_table();lz_chat_switch_options('so');"><td><!--lang_client_switch_sounds--></td></tr>
                    <tr id="lz_cf_et" onclick="lz_chat_switch_options_table();lz_chat_switch_options('et');" style="display:<!--et_vis-->;"><td><!--lang_client_request_chat_transcript_short--></td></tr>
                    <tr id="lz_cf_ed" onclick="lz_chat_switch_options_table();lz_chat_switch_details(false);"><td><!--lang_client_change_my_details--></td></tr>
                    <tr id="lz_cf_ec" onclick="lz_chat_switch_options_table();lz_chat_close();"><td><!--lang_client_end_chat--></td></tr>
                </table>
                <div id="lz_chat_state_image"></div>
                <div id="lz_chat_operator_fullname"></div>
                <div id="lz_chat_operator_groupname"></div>
                <div id="lz_chat_feedback_init" class="lz_chat_clickable_image" onclick="lz_chat_show_feedback();" title="<!--lang_client_rate_representative-->"></div>
            </div>
            <div id="lz_chat_content_box" style="display:none;" class="unmovable lz_chat_content_box_fh" onScroll="lz_chat_scroll();"><div id="lz_chat_content_inlay" class="unmovable"></div></div>
            <div id="lz_chat_overlay_options_box_bg" style="display:none;opacity:0;"></div>
            <div id="lz_chat_overlay_loading" style="display:none;"><div><!--lang_client_loading--></div></div>
            <div id="lz_chat_overlay_options_frame" style="display:none;">
                <div id="lz_chat_overlay_options_box" style="display:none;border-spacing:0;opacity:0;">
                    <div id="lz_chat_overlay_option_title" class="lz_chat_overlay_options_box_base" style="background:<!--bgc-->;color: <!--tc-->;"><!--lang_client_options--></div>
                    <div id="lz_chat_overlay_option_function_fu" class="lz_chat_overlay_options_box_base lz_chat_overlay_options_group">
                        <iframe id="lz_chat_overlay_file_upload_frame"></iframe>
                    </div>
                    <div id="lz_chat_overlay_option_function_so" class="lz_chat_overlay_options_box_base lz_chat_overlay_options_group">
                        <div style="top:10px;left:8px;width:18px;" class="lz_chat_overlay_options_box_base"><input type="checkbox" id="lz_chat_overlay_options_sound" value=""></div>
                        <div style="top:10px;left:26px;right:7px;" class="lz_chat_overlay_options_box_base"><!--lang_client_sounds--></div>
                    </div>
                    <div id="lz_chat_overlay_option_function_et" class="lz_chat_overlay_options_box_base lz_chat_overlay_options_group">
                        <div style="top:10px;left:8px;width:18px;" class="lz_chat_overlay_options_box_base"><input type="checkbox" id="lz_chat_overlay_options_transcript" value="" onclick="document.getElementById('lz_chat_overlay_options_transcript_email').disabled = !this.checked;" <!--activate_transcript-->></div>
                        <div style="top:10px;left:26px;right:7px;" class="lz_chat_overlay_options_box_base"><!--lang_client_request_chat_transcript--><br><input id="lz_chat_overlay_options_transcript_email" class="lz_form_base lz_form_box lz_chat_overlay_options_options_box" maxlength="254"></div>
                    </div>
                    <div id="lz_chat_overlay_option_function_tr" style="display:<!--tr_vis-->;" class="lz_chat_overlay_options_box_base lz_chat_overlay_options_group">
                        <div style="top:10px;left:8px;width:18px;" class="lz_chat_overlay_options_box_base"><input type="checkbox" id="lz_chat_overlay_options_trans" onClick="lz_chat_change_translation();" value=""></div>
                        <div style="top:10px;left:26px;right:7px;" class="lz_chat_overlay_options_box_base"><!--lang_client_use_auto_translation_service_short--><br><br><!--lang_client_my_language--><select id="lz_chat_overlay_options_language" class="lz_form_base lz_form_box lz_form_select lz_chat_overlay_options_options_box" onClick="lz_chat_change_translation();" DISABLED><!--languages--></select></div>
                    </div>
                    <div style="right:10px;bottom:12px;left:10px;" class="lz_chat_overlay_options_box_base lz_overlay_chat_button unselectable" onclick="lz_chat_switch_options(lz_chat_option_function,false);"><!--lang_client_close--></div>
                </div>
            </div>
            <div id="lz_chat_data_form" style="display:none;">
                <div id="lz_chat_data_header">
                    <div id="lz_chat_data_form_header_title"><!--lang_client_ticket_header--></div>
                    <div id="lz_chat_data_form_header_text"><!--ticket_information--></div>
                </div>
                <!--chat_login_inputs-->
                <a id="lz_chat_file_po" style="color:<!--bgcd-->;float:right;margin:10px 5px;" href="javascript:lz_chat_pop_out();"><!--lang_client_attach_file--></a>
                <div style="bottom:45px;left:5px;display:none;" class="lz_chat_overlay_options_box_base" id="lz_form_mandatory">
                    <table><tr><td style="vertical-align:top;"><div class="lz_input_icon lz_required"></div></td><td>&nbsp;<!--lang_client_required_field--></td></tr></table>
                </div>
                <table class="lz_input" id="lz_group_selection_box">
                    <tr>
                        <td class="lz_form_field"><strong><!--lang_client_group-->:</strong></td>
                        <td align="right"><select id="lz_form_groups" class="lz_form_base lz_form_box lz_form_select" onChange="parent.parent.lz_chat_change_group(this,true);" onKeyUp="this.blur();" onclick="parent.parent.lz_chat_pre_change_group(this);"></select></td>
                        <td class="lz_form_icon"><div id="lz_form_mandatory_group" style="display:none;"></div></td>
                        <td><div class="lz_form_info_box" id="lz_form_info_group"></div></td>
                    </tr>
                </table>
                <div class="lz_chat_overlay_options_box_base lz_overlay_chat_button lz_overlay_light_button unselectable" id="lz_chat_overlay_data_form_ok_button" onclick="lz_chat_data_form_result(true);"><!--lang_client_leave_message--></div>
                <div class="lz_chat_overlay_options_box_base lz_overlay_chat_button unselectable" id="lz_chat_overlay_data_form_cancel_button" onclick="lz_chat_data_form_result(false);"><!--lang_client_back--></div>
            </div>
            <div id="lz_chat_overlay_ticket" style="display:none;">
                <div id="lz_chat_ticket_received" class="lz_chat_overlay_options_box_base lz_overlay_chat_ticket_response"><!--lang_client_message_received--></div>
                <div id="lz_chat_ticket_flood" class="lz_chat_overlay_options_box_base lz_overlay_chat_ticket_response" style="color:#cc3333;font-weight:bold;"><!--lang_client_message_flood--></div>
                <div style="bottom:14px;left:14px;right:14px;" class="lz_chat_overlay_options_box_base lz_overlay_chat_button unselectable" onclick="lz_chat_data_form_result(false);"><!--lang_client_back--></div>
            </div>
            <div id="lz_chat_overlay_loading_bar" style="display:none;"><img src="<!--server-->images/chat_loading.gif"></div>
            <div id="lz_chat_overlay_bottom">
                <div style="height:24px;vertical-align:middle;">
                    <div id="lz_chat_overlay_info"></div>
                </div>
                <div>
                    <img src="<!--server-->images/chat_loading.gif" id="lz_bot_reply_loading" style="margin-top:5px;display:none;">
                    <textarea onkeydown="if(event.keyCode==13){return lz_chat_message(null,null);}else{lz_chat_switch_extern_typing(true);return true;}" onchange="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);" onkeyup="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);" id="lz_chat_text" class="lz_chat_overlay_text"></textarea>
                </div>
            </div>
        </div>
	</div>
    <div style="bottom:6px;left:10px;color: <!--tc--> !important;font-weight:normal;<!--apo-->;" id="lz_chat_apo" onclick="javascript:lz_chat_pop_out();" class="lz_chat_overlay_options_box_base lz_overlay_chat_footer unselectable lz_overlay_chat_options_link"><!--lang_client_popout--></div>
    <div style="bottom:6px;right:10px;color: <!--tc--> !important;" class="lz_chat_overlay_options_box_base lz_overlay_chat_footer unselectable lz_overlay_chat_options_link"><!--param--></div>
</div>