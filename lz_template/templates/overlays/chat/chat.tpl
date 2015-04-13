<div id="lz_chat_overlay_main" class="lz_chat_base notranslate" style="direction:<!--dir-->;border-radius:6px;background:<!--bgc-->;">
    <div id="lz_chat_waiting_messages" style="display:none;" onclick="lz_chat_change_state(true,false);">
        <div id="lz_chat_waiting_message_count" style="display:none;"></div>
    </div>
    <div cellpadding="0" cellspacing="0" style="position:absolute;top:5px;left:6px;height:25px;right:6px;z-index:100015;background:<!--bgc-->;color:<!--tc-->;">
        <div class="lz_overlay_chat_gradient" class="unselectable">
            <div id="lz_chat_overlay_text" style="color:<!--tc-->;" onclick="lz_chat_change_state(true,false);" class="unselectable unmovable"></div>
            <div id="lz_chat_minimize" onclick="lz_chat_change_state(true,true);" class="unselectable unmovable">
                <div id="lz_chat_state_change" style="border-bottom:3px solid <!--tc-->;display:none;" class="unselectable"></div>
            </div>
        </div>
    </div>
    <div id="lz_chat_content" class="unmovable">
		<div class="lz_chat_content_table" class="unmovable">
            <div id="lz_chat_state_bar" onclick="lz_chat_close();"><a class="lz_decline_link"><!--lang_client_close--></a></div>
            <div id="lz_chat_content_box" style="display:none;" class="unmovable lz_chat_content_box_fh" onScroll="lz_chat_scroll();"><div id="lz_chat_content_inlay" class="unmovable"></div></div>
            <div id="lz_chat_overlay_options_box_bg" style="display:none;opacity:0;"></div>
            <div id="lz_chat_overlay_loading" style="display:none;"><div><!--lang_client_loading--></div></div>
            <div id="lz_chat_overlay_options_frame" style="display:none;">
                <div id="lz_chat_overlay_options_box" style="display:none;border-spacing:0px;opacity:0;height:300px;width:233px;">
                    <div id="lz_chat_overlay_option_title" class="lz_chat_overlay_options_box_base" style="background:<!--bgc-->;color: <!--tc-->;"><!--lang_client_options--></div>

                    <div style="top:44px;height:30px;" class="lz_chat_overlay_options_box_base lz_chat_overlay_options_group">
                        <div style="top:7px;left:8px;width:18px;" class="lz_chat_overlay_options_box_base"><input type="checkbox" id="lz_chat_overlay_options_sound" value=""></div>
                        <div style="top:7px;left:26px;" class="lz_chat_overlay_options_box_base"><!--lang_client_sounds--></div>
                    </div>
                    <div style="top:84px;height:75px;" class="lz_chat_overlay_options_box_base lz_chat_overlay_options_group">
                        <div style="top:7px;left:8px;width:18px;" class="lz_chat_overlay_options_box_base"><input type="checkbox" id="lz_chat_overlay_options_transcript" value="" onclick="document.getElementById('lz_chat_overlay_options_transcript_email').disabled = !this.checked;" <!--offer_transcript--> <!--activate_transcript-->></div>
                        <div style="top:7px;left:26px;" class="lz_chat_overlay_options_box_base"><!--lang_client_request_chat_transcript--><br><input id="lz_chat_overlay_options_transcript_email" class="lz_form_base lz_form_box lz_chat_overlay_options_options_box" maxlength="254"></div>
                    </div>
                    <div style="top:169px;height:75px;display:<!--tr_vis-->;" class="lz_chat_overlay_options_box_base lz_chat_overlay_options_group">
                        <div style="top:7px;left:8px;width:18px;" class="lz_chat_overlay_options_box_base"><input type="checkbox" id="lz_chat_overlay_options_trans" onClick="lz_chat_change_translation();" value=""></div>
                        <div style="top:7px;left:26px;" class="lz_chat_overlay_options_box_base"><!--lang_client_use_auto_translation_service--><select id="lz_chat_overlay_options_language" class="lz_form_base lz_form_box lz_form_select lz_chat_overlay_options_options_box" onClick="lz_chat_change_translation();" DISABLED><!--languages--></select></div>
                    </div>

                    <div style="right:10px;bottom:15px;left:10px;" class="lz_chat_overlay_options_box_base lz_overlay_chat_button unselectable" onclick="lz_chat_switch_options(false);"><!--lang_client_save--></div>
                </div>
            </div>
            <div id="lz_chat_data_form" style="display:none;">
                    <div id="lz_chat_data_header" class="lz_chat_data_form_header">
                        <div id="lz_chat_data_form_header_title"><!--lang_client_ticket_header--></div>
                        <div id="lz_chat_data_form_header_text"><!--ticket_information--></div>
                    </div>
                    <!--chat_login_inputs-->
                <div style="bottom:45px;left:5px;display:none;" class="lz_chat_overlay_options_box_base" id="lz_form_mandatory">
                    <table><tr><td style="vertical-align:top;"><div class="lz_input_icon lz_required"></div></td><td>&nbsp;<!--lang_client_required_field--></td></tr></table>
                </div>
                <table cellpadding="0" cellspacing="0" class="lz_input" id="lz_group_selection_box">
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
                <div id="lz_chat_ticket_flood" class="lz_chat_overlay_options_box_base lz_overlay_chat_ticket_response" style="color:#cc3333;"><!--lang_client_message_flood--></div>
                <div style="bottom:14px;left:14px;right:14px;" class="lz_chat_overlay_options_box_base lz_overlay_chat_button unselectable" onclick="lz_chat_data_form_result(false);"><!--lang_client_back--></div>
            </div>
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
    <div style="bottom:0px;left:10px;" class="lz_chat_overlay_options_box_base lz_overlay_chat_footer unselectable">
        <table style="border-spacing:0px;" align="center">
            <tr>
                <td nowrap onclick="javascript:lz_chat_switch_options(false,false);" id="lz_overlay_chat_options_button" class="lz_overlay_chat_options_link" style="color: <!--tc-->;"><!--lang_client_options--></td>
                <td style="font-weight:normal;<!--apo-->;color: <!--tc-->;" id="lz_chat_apo" onclick="javascript:lz_chat_pop_out();" class="lz_overlay_chat_options_link"><!--lang_client_popout--></td>
            </tr>
        </table>
    </div>
    <div style="bottom:0px;right:3px;" class="lz_chat_overlay_options_box_base lz_overlay_chat_footer unselectable"">
        <table style="border-spacing:0px;" align="center">
            <tr>
                <td style="text-align:right;color: <!--tc--> !important;"><!--param--></td>
            </tr>
        </table>
    </div>
</div>