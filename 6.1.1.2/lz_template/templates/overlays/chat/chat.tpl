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
            <div id="lz_chat_overlay_icon" style="border-left: 1px solid <!--bgcm-->;"></div>
        </div>
    </div>
    <div id="lz_chat_content" class="unmovable">
		<div class="lz_chat_content_table" class="unmovable">
            <div id="lz_chat_state_bar">
                <div id="lz_chat_menu_line" class="unselectable">
                    <span onclick="lz_chat_switch_options_table();" id="lz_chat_options_button"><!--lang_client_options--></span>
                    <span onclick="lz_chat_close();" id="lz_chat_close_button"><!--lang_client_end_chat--></span>
                </div>
                <div id="lz_chat_options_table" style="display:none" class="unselectable">
                    <div id="lz_cf_tr" onclick="lz_chat_switch_options_table();lz_chat_switch_options('tr');" style="display:<!--tr_vis-->;"><!--lang_client_use_auto_translation_service_short--></div>
                    <div id="lz_cf_fu" onclick="lz_chat_switch_options_table();lz_chat_switch_options('fu');"><!--lang_client_send_file--></div>
                    <div id="lz_cf_so" onclick="lz_chat_switch_options_table();lz_chat_switch_options('so');"><!--lang_client_switch_sounds--></div>
                    <div id="lz_cf_et" onclick="lz_chat_switch_options_table();lz_chat_switch_options('et');" style="display:<!--et_vis-->;"><!--lang_client_request_chat_transcript_short--></div>
                    <div id="lz_cf_ed" onclick="lz_chat_switch_options_table();lz_chat_switch_details(false);"><!--lang_client_change_my_details--></div>
                    <div id="lz_cf_pr" onclick="lz_chat_switch_options_table();lz_chat_print();"><!--lang_client_print--></div>
                    <div id="lz_cf_ec" onclick="lz_chat_switch_options_table();lz_chat_close();"><!--lang_client_end_chat--></div>
                </div>
                <div id="lz_chat_state_image"></div>
                <div id="lz_chat_operator_details">
                    <span id="lz_chat_operator_fullname"></span><br>
                    <span id="lz_chat_operator_groupname"></span>
                </div>
                <div id="lz_chat_feedback_init" class="lz_chat_clickable_image" onclick="lz_chat_show_feedback();" title="<!--lang_client_rate_representative-->"></div>
            </div>
            <div id="lz_chat_content_box" style="display:none;" class="unmovable lz_chat_content_box_fh" onScroll="lz_chat_scroll();" onclick="lz_chat_switch_options_table(true);"><div id="lz_chat_content_inlay" class="unmovable"></div></div>
            <div id="lz_chat_overlay_options_box_bg" style="display:none;opacity:0;"></div>
            <div id="lz_chat_overlay_loading"style="display:none;"><div class="lz_anim_loading" style="margin-top:15px;border:8px solid #b2b2b2;border-right-color:transparent;"></div></div>
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
                <div>

                    <div id="lz_chat_data_header">
                        <div id="lz_chat_data_form_header_title"><!--lang_client_ticket_header--></div>
                        <div id="lz_chat_data_form_header_text"><!--ticket_information--></div>
                    </div>
                    <div id="lz_chat_data_form_inputs" style="position:absolute;left:0;right:0;padding:0 26px 0 30px;">
                        <!--chat_login_group_top-->
                        <!--chat_login_inputs-->
                        <div style="text-align:right;margin:5px;"><a id="lz_chat_file_po" style="color:<!--bgcd-->;" href="javascript:lz_chat_pop_out();"><!--lang_client_attach_file--></a></div>
                        <!--chat_login_group_bottom-->
                        <div style="display:none;" id="lz_form_mandatory" class="lz_input_icon lz_required lz_required_info"><!--lang_client_required_field--></div>

                        <br>
                        <div class="lz_chat_overlay_options_box_base lz_overlay_chat_button lz_overlay_light_button unselectable" id="lz_chat_overlay_data_form_ok_button" onclick="lz_chat_data_form_result(true);"><!--lang_client_leave_message--></div>
                        <div class="lz_chat_overlay_options_box_base lz_overlay_chat_button unselectable" id="lz_chat_overlay_data_form_cancel_button" onclick="lz_chat_data_form_result(false);"><!--lang_client_back--></div>

                    </div>

                </div>
            </div>
            <div id="lz_chat_overlay_ticket" style="display:none;">
                <div id="lz_chat_ticket_received" class="lz_chat_overlay_options_box_base lz_overlay_chat_ticket_response"><!--lang_client_message_received--></div>
                <div id="lz_chat_ticket_flood" class="lz_chat_overlay_options_box_base lz_overlay_chat_ticket_response" style="color:#cc3333;font-weight:bold;"><!--lang_client_message_flood--></div>
                <div style="bottom:14px;left:14px;right:14px;" class="lz_chat_overlay_options_box_base lz_overlay_chat_button unselectable" onclick="lz_chat_data_form_result(false);"><!--lang_client_back--></div>
            </div>
            <div id="lz_chat_overlay_loading_bar" class="lz_anim_loading" style="border: 4px solid #b2b2b2;border-right-color: transparent;"></div>
            <div id="lz_chat_overlay_info"></div>
            <div id="lz_chat_overlay_typing_info"></div>
            <div id="lz_chat_overlay_bottom">
                <div>
                    <div id="lz_chat_bot_reply_loading" class="lz_anim_loading" style="margin-top:15px;border:8px solid #b2b2b2;border-right-color: transparent;display:none;"></div>
                    <textarea id="lz_chat_text" placeholder="<!--lang_client_type_message-->" onfocus="lz_chat_switch_options_table(true);" onkeydown="if(event.keyCode==13){return lz_chat_message(null,null);}else{lz_chat_switch_extern_typing(true);return true;}" onchange="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);" onkeyup="lz_overlay_chat_impose_max_length(this, <!--overlay_input_max_length-->);"></textarea>
                </div>
            </div>
        </div>
	</div>
    <div id="lz_chat_apo" style="color:<!--tc--> !important;<!--apo-->;" onclick="javascript:lz_chat_pop_out();" class="lz_chat_overlay_options_box_base lz_overlay_chat_footer unselectable lz_overlay_chat_options_link"><!--lang_client_popout--></div>
    <div id="lz_chat_apa" style="color: <!--tc--> !important;" class="lz_chat_overlay_options_box_base lz_overlay_chat_footer unselectable lz_overlay_chat_options_link"><!--param--></div>
</div>
