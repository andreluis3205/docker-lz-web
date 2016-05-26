<!DOCTYPE HTML>
<html>
<head>
	<META NAME="robots" CONTENT="noindex,follow">
	<title>LiveZilla Live Chat Software</title>
	<link rel="stylesheet" type="text/css" href="./templates/style_chat.min.css" onload="parent.lz_chat_execute('<!--post_chat_js-->');">
</head>
<body style="margin:0;padding:0;width:100%;">
    <!--alert-->
    <!--header-->
    <div id="lz_chat_navigation" style="height:32px;display:block;">
        <table id="lz_chat_navigation_table">
            <tr>
                <td id="lz_chat_site_title"><!--config_gl_site_name--></td>
                <td style="text-align:right;width:60px;" id="lz_cf_ra"></td>
                <td style="text-align:left;width:100px;">
                    <div id="lz_chat_options" onclick="parent.lz_chat_switch_options();"><!--lang_client_options--></div>
                </td>
            </tr>
        </table>
    </div>
    <table id="lz_chat_options_table" style="display:none;" class="unselectable">
        <tr onclick="parent.lz_chat_switch_options();parent.lz_chat_close();">
            <td class="lz_chat_options_table_logo"><img class="lz_chat_clickable_image" src="./images/button_back.gif" border="0" title="<!--lang_client_goto_login-->" alt="<!--lang_client_goto_login-->"></td>
            <td><!--lang_client_goto_login--></td>
        </tr>
        <tr id="lz_cf_sm" style="display:none;" onclick="parent.lz_chat_switch_options();parent.lz_chat_switch_emoticons();">
            <td class="lz_chat_options_table_logo"><input id="lz_cf_value_sm" type="hidden" value="<!--SM_HIDDEN-->"><img id="lz_chat_smiley_button" src="./images/button_smiley.gif" border="0" title="<!--lang_client_insert_smiley-->" alt="<!--lang_client_insert_smiley-->"></td>
            <td><!--lang_client_insert_smiley--></td>
        </tr>

        <tr id="lz_cf_tr" style="display:none;" onclick="parent.lz_chat_switch_options();parent.lz_chat_switch_auto_translate();">
            <td class="lz_chat_options_table_logo"><input id="lz_cf_value_tr" type="hidden" value="<!--TR_HIDDEN-->"><img src="./images/button_translate.gif" border="0" title="<!--lang_client_use_auto_translation_service_short-->" alt="<!--lang_client_use_auto_translation_service_short-->"></td>
            <td><!--lang_client_use_auto_translation_service_short--></td>
        </tr>

        <tr id="lz_cf_pr" style="display:none;" onclick="parent.lz_chat_switch_options();parent.lz_chat_print();">
            <td class="lz_chat_options_table_logo"><input id="lz_cf_value_pr" type="hidden" value="<!--PR_HIDDEN-->"><img id="lz_chat_print_button" src="./images/button_print.gif" border="0" title="<!--lang_client_print-->" alt="<!--lang_client_print-->"></td>
            <td><!--lang_client_print--></td>
        </tr>

        <tr id="lz_cf_fu" style="display:none;" onclick="parent.lz_chat_switch_options();parent.lz_chat_switch_file_upload();">
            <td class="lz_chat_options_table_logo"><input id="lz_cf_value_fu" type="hidden" value="<!--FU_HIDDEN-->"><img src="./images/button_file.gif" border="0" title="<!--lang_client_send_file-->"  alt="<!--lang_client_send_file-->"></td>
            <td><!--lang_client_send_file--></td>
        </tr>

        <tr id="lz_cf_so" style="display:none;" onclick="parent.lz_chat_switch_options();parent.lz_chat_switch_sound();">
            <td class="lz_chat_options_table_logo"><input id="lz_cf_value_so" type="hidden" value="<!--SO_HIDDEN-->"><img id="lz_chat_sound_button" src="./images/button_s1.gif" border="0" alt="<!--lang_client_switch_sounds-->"></td>
            <td><!--lang_client_switch_sounds--></td>
        </tr>

        <tr id="lz_cf_et" style="display:none;" onclick="parent.lz_chat_switch_options();parent.lz_chat_switch_transcript();">
            <td class="lz_chat_options_table_logo"><input id="lz_cf_value_et" type="hidden" value="<!--ET_HIDDEN-->"><img src="./images/button_mail.gif" border="0" title="<!--lang_client_request_chat_transcript_short-->"  alt="<!--lang_client_request_chat_transcript_short-->"></td>
            <td><!--lang_client_request_chat_transcript_short--></td>
        </tr>

        <tr onclick="parent.close();">
            <td class="lz_chat_options_table_logo"><img src="./images/button_close.gif" border="0" title="<!--lang_client_close_window-->" alt="<!--lang_client_close_window-->"></td>
            <td><!--lang_client_close_window--></td>
        </tr>
    </table>
    <div class="lz_chat_function_frame">
        <fieldset id="lz_chat_auto_translate_frame">
            <legend>
                <label><input id="lz_translation_service_active" type="checkbox"><!--lang_client_use_auto_translation_service_short--></label>
            </legend>
            <table class="function_frame_table">
                <tr>
                    <td><!--lang_client_my_language--></td>
                </tr>
                <tr>
                    <td style="text-align:right;" onclick="document.getElementById('lz_translation_service_active').checked=true;"><select class="lz_form_box" id="lz_chat_translation_target_language"><!--languages--></select>&nbsp;</td>
                </tr>
            </table>
        </fieldset>
    </div>
    <div class="lz_chat_function_frame">
        <fieldset id="lz_chat_transcript_frame">
            <legend>
                <label><input id="lz_chat_send_chat_transcript" type="checkbox"><!--lang_client_request_chat_transcript--></label>
            </legend>
            <table class="function_frame_table">
                <tr>
                    <td onclick="document.getElementById('lz_chat_send_chat_transcript').checked=true;document.getElementById('lz_chat_transcript_email').focus();"><input type="text" class="lz_form_base lz_form_box" placeholder="email@domain.com" id="lz_chat_transcript_email"></td>
                </tr>
            </table>
        </fieldset>
    </div>
    <div class="lz_chat_function_frame" id="lz_chat_emoticons_container">
        <fieldset id="lz_chat_emoticons_frame">
            <legend>
                <label><!--lang_client_insert_smiley--></label>
            </legend>
            <table class="function_frame_table">
                <tr>
                    <td><img onClick="parent.lz_chat_take_smiley('smile');" src="./images/smilies/smile.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('sad');" src="./images/smilies/sad.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('neutral');" src="./images/smilies/neutral.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('tongue');" src="./images/smilies/tongue.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('cry');" src="./images/smilies/cry.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('lol');" src="./images/smilies/lol.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                </tr>
                <tr>
                    <td><img onClick="parent.lz_chat_take_smiley('shocked');" src="./images/smilies/shocked.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('wink');" src="./images/smilies/wink.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('cool');" src="./images/smilies/cool.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('sick');" src="./images/smilies/sick.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('question');" src="./images/smilies/question.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                    <td><img onClick="parent.lz_chat_take_smiley('sleep');" src="./images/smilies/sleep.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                </tr>
            </table>
        </fieldset>
    </div>
    <div id="lz_chat_com_frame" class="lz_chat_function_frame">
        <table>
            <tr>
                <td><img src="./images/icon_voucher.gif" width="16" height="16" border="0" alt=""></td>
                <td><strong><!--lang_client_voucher--></strong>&nbsp;(<span id="lz_chat_com_chat_change_voucher" style="display:none;"><a class="lz_chat_com_chat_voucher_link" href="javascript:parent.lz_chat_change_voucher_init();"><!--lang_client_change--></a> | </span><a class="lz_chat_com_chat_voucher_link" href="javascript:parent.lz_chat_extend_voucher();"><!--lang_client_extend--></a>):&nbsp;
                </td>
                <td id="lz_chat_com_chat_chat_amount_caption"><!--lang_client_voucher_chat_sessions--></td>
                <td id="lz_chat_com_chat_chat_amount_value" class="lz_chat_com_chat_panel_value">0</td>
                <td id="lz_chat_com_chat_chat_length_spacer">&nbsp;<img src="./images/lz_com_chat_spacer.gif" alt="" width="2" height="17" border="0">&nbsp;</td>
                <td id="lz_chat_com_chat_chat_length_caption"><!--lang_client_voucher_chat_time--></td>
                <td id="lz_chat_com_chat_chat_length_value" class="lz_chat_com_chat_panel_value">00:00:00</td>
                <td id="lz_chat_com_chat_chat_period_spacer">&nbsp;<img src="<!--server-->images/lz_com_chat_spacer.gif" alt="" width="2" height="17" border="0">&nbsp;</td>
                <td id="lz_chat_com_chat_chat_period_caption"><!--lang_client_voucher_expires--></td>
                <td id="lz_chat_com_chat_chat_period_value" class="lz_chat_com_chat_panel_value">0</td>
                <td id="lz_chat_com_chat_chat_voucher_id" class="lz_chat_com_chat_panel_value" style="display:none;"></td>
                <td>&nbsp;</td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_function_splitter"></div>
    <div id="lz_chat_main" style="display:none;"></div>
    <div id="lz_chat_members_box" class="lz_chat_members_back unselectable" style="display:none;"></div>
    <div id="lz_chat_call_me_back_info" style="visibility:hidden;">
        <table>
            <tr>
                <td id="lz_chat_call_me_back_wa"><!--lang_client_init_call_me_now--></td>
            </tr>
            <tr>
                <td id="lz_chat_call_me_back_st"><div class="lz_anim_loading"></div></td>
            </tr>
            <tr>
                <td>
                    <br><input type="button" class="lz_form_button lz_form_multi_button" value="<!--lang_client_activate_chat-->" onclick="parent.lz_chat_activate();">
                    <br><input type="button" class="lz_form_button lz_form_multi_button lz_form_button_disabled" id="lz_chat_callback_feedback" value="<!--lang_client_rate_representative-->" onclick="parent.lz_chat_show_feedback();" DISABLED>
                    <br><input type="button" class="lz_form_button lz_form_multi_button" value="<!--lang_client_leave_message-->" onclick="parent.lz_chat_data.ChatActive=true;parent.lz_chat_goto_message(true,false);">
                </td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_floor" dir="<!--dir-->" style="display:none;position:absolute;height:65px;bottom:20px;right:0;left:0;" onmouseover="parent.lz_chat_chat_resize_detect(true);" onmouseout="parent.lz_chat_chat_resize_detect(false);">
        <div style="left:0;right:0;top:0;bottom:20px;">
            <textarea id="lz_chat_text" placeholder="<!--lang_client_type_message-->" onkeydown="parent.lz_switch_title_mode(false);if(event.keyCode==13){return parent.lz_chat_message('','');}else{parent.setTimeout('lz_chat_switch_extern_typing(true);',30);return true;}"></textarea>
        </div>
        <input type="button" id="lz_chat_submit" placeholder="<!--lang_client_type_message-->" onclick="return parent.lz_chat_message('','');" name="lz_send_button" value="" title="<!--lang_client_send-->">
    </div>
    <div id="lz_chat_operator_typing_info"></div>
    <div id="lz_chat_param"><!--param--></div>
</body>
</html>
