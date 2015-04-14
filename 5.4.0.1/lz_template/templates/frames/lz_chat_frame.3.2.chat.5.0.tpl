<!DOCTYPE HTML>
<html style="width:100%;">
<head>
	<META NAME="robots" CONTENT="noindex,follow">
	<title>LiveZilla Live Chat Software</title>
	<link rel="stylesheet" type="text/css" href="<!--server-->templates/style_chat.css">
</head>
<body topmargin="0" leftmargin="0" style="margin:0px;padding:0px;width:100%;" onscroll="parent.parent.lz_chat_chat_alert_move();" onresize="parent.parent.lz_chat_chat_alert_move();">
    <!--alert-->

    <div id="lz_chat_auto_translate_frame" class="lz_chat_function_frame">
        <table cellspacing="1" cellpadding="1" height="40">
            <tr>
                <td width="15"></td>
                <td><input id="lz_translation_service_active" type="checkbox" onclick="document.getElementById('lz_chat_translation_target_language').disabled=!this.checked;">&nbsp;</td>
                <td><!--lang_client_use_auto_translation_service-->&nbsp;&nbsp;</td>
                <td style="text-align:right;"><select id="lz_chat_translation_target_language" DISABLED><!--languages--></select>&nbsp;</td>
                <td width="5"></td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_transcript_frame" class="lz_chat_function_frame">
        <table cellspacing="1" cellpadding="1" height="40">
            <tr>
                <td width="15"></td>
                <td><input id="lz_chat_send_chat_transcript" type="checkbox" value="" onclick="document.getElementById('lz_chat_transcript_email').disabled=!this.checked;">&nbsp;</td>
                <td><!--lang_client_request_chat_transcript-->&nbsp;&nbsp;&nbsp;</td>
                <td style="text-align:right;"><input type="text" id="lz_chat_transcript_email">&nbsp;</td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_emoticons_frame" class="lz_chat_function_frame">
        <table cellpadding="2" cellspacing="4" align="center">
            <tr>
                <td><img onClick="parent.parent.lz_chat_take_smiley('smile');" src="./images/smilies/smile.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('sad');" src="./images/smilies/sad.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('neutral');" src="./images/smilies/neutral.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('tongue');" src="./images/smilies/tongue.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('cry');" src="./images/smilies/cry.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('lol');" src="./images/smilies/lol.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('shocked');" src="./images/smilies/shocked.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('wink');" src="./images/smilies/wink.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('cool');" src="./images/smilies/cool.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('sick');" src="./images/smilies/sick.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('question');" src="./images/smilies/question.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
                <td><img onClick="parent.parent.lz_chat_take_smiley('sleep');" src="./images/smilies/sleep.gif" alt="" border="0" class="lz_chat_clickable_image"></td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_feedback_frame" class="lz_chat_function_frame">
        <table cellspacing="3" cellpadding="4" width="100%">
            <tr>
                <td width="5"></td>
                <td width="80" style="vertical-align:top;">
                    <table cellpadding="3">
                        <tr>
                            <td NOWRAP><span class="lz_chat_rating_text"><!--lang_client_rate_qualification-->:</span></td>
                            <td rowspan="2"></td>
                            <td NOWRAP><!--rate_1--></td>
                            <td rowspan="2"></td>
                        </tr>
                        <tr>
                            <td NOWRAP><span class="lz_chat_rating_text"><!--lang_client_rate_politeness-->:</span></td>
                            <td NOWRAP><!--rate_2--></td>
                        </tr>
                    </table>
                </td>
                <td width="*"><textarea id="lz_chat_rate_comment" class="lz_form_area" onclick="parent.parent.lz_chat_feedback_prepare();" onchange="parent.parent.lz_global_impose_max_length(this, 400);" onkeyup="parent.parent.lz_global_impose_max_length(this, 400);"><!--lang_client_rate_reason--></textarea></td>
                <td width="5"></td>
                <td width="60" style="vertical-align:top;"><input type="button" id="lz_chat_rate_button" onclick="parent.parent.lz_chat_feedback_validate();" value="<!--lang_client_send-->"></td>
                <td width="5"></td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_file_frame" class="lz_chat_function_frame">
        <span id="lz_chat_file_title"><!--lang_client_file-->:&nbsp;</span>
        <input type="text" id="lz_chat_file_name" readonly>
        <input type="button" id="lz_chat_file_select" value="<!--lang_client_file-->">
        <form action="./<!--file_chat-->?template=lz_chat_frame.3.2.chat.1.0&file=true<!--website-->" method="post" enctype="multipart/form-data" name="lz_file_form">
            <input type="hidden" name="p_request" value="extern">
            <input type="hidden" name="p_action" value="file_upload">
            <input type="hidden" id="lz_chat_upload_form_userid" name="p_extern_userid">
            <input type="hidden" id="lz_chat_upload_form_browser" name="p_extern_browserid">
            <input type="file" name="userfile" id="lz_chat_file_base" onchange="parent.parent.lz_chat_file_changed();">
        </form>
        <input type="button" id="lz_chat_file_send" value="<!--lang_client_send-->" onclick="parent.parent.lz_chat_file_request_upload();">
        <div id="lz_chat_file_load"></div>
        <img id="lz_chat_file_success" src="./images/icon_file_upload_success.gif" alt="" width="35" height="26" border="0">
        <img id="lz_chat_file_error" src="./images/icon_file_upload_error.gif" alt="" width="35" height="26" border="0">
        <div id="lz_chat_file_status"></div>
    </div>
    <div id="lz_chat_com_frame" class="lz_chat_function_frame">
        <table cellspacing="1" cellpadding="1" height="40">
            <tr>
                <td width="5"></td>
                <td width="20"><img src="<!--server-->images/icon_voucher.gif" width="16" height="16" border="0" alt=""></td>
                <td><strong><!--lang_client_voucher--></strong>&nbsp;(<span id="lz_chat_com_chat_change_voucher" style="display:none;"><a class="lz_chat_com_chat_voucher_link" href="javascript:parent.parent.lz_chat_change_voucher_init();"><!--lang_client_change--></a> | </span><a class="lz_chat_com_chat_voucher_link" href="javascript:parent.parent.lz_chat_extend_voucher();"><!--lang_client_extend--></a>):&nbsp;
                </td>
                <td id="lz_chat_com_chat_chat_amount_caption"><!--lang_client_voucher_chat_sessions--></td>
                <td id="lz_chat_com_chat_chat_amount_value" class="lz_chat_com_chat_panel_value">0</td>
                <td id="lz_chat_com_chat_chat_length_spacer">&nbsp;<img src="<!--server-->images/lz_com_chat_spacer.gif" alt="" width="2" height="17" border="0">&nbsp;</td>
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
    <div id="lz_chat_call_me_back_info" style="visibility:hidden;">
        <table class="lz_chat_call_me_now" align="center">
            <tr>
                <td width="5%" align="right"></td>
                <td align="center">
                    <div id="lz_chat_call_me_back_st">
                        <img src="./images/lz_call_me_now.gif" alt="">
                    </div>
                    <br><br>
                    <div id="lz_chat_call_me_back_wa">
                        <!--lang_client_init_call_me_now-->
                        <br><br>
                    </div>
                    <br>
                </td>
                <td width="5%"></td>
            </tr>
            <tr>
                <td colspan="3" align="center">
                    <input type="button" class="lz_form_button" value="<!--lang_client_activate_chat-->" onclick="parent.parent.lz_chat_activate();">
                    <input type="button" class="lz_form_button" value="<!--lang_client_rate_representative-->" onclick="parent.parent.lz_chat_switch_feedback();">
                    <input type="button" class="lz_form_button" value="<!--lang_client_leave_message-->" onclick="parent.parent.lz_chat_goto_message(true,false);">
                </td>
            </tr>
        </table>
    </div>
    <div id="lz_chat_floor" dir="<!--dir-->" style="display:none;position:absolute;height:65px;bottom:0;right:0;left:0;" onmouseover="parent.parent.lz_chat_chat_resize_detect(true);" onmouseout="parent.parent.lz_chat_chat_resize_detect(false);">
        <div style="left:10px;right:75px;top:10px;bottom:20px;">
            <textarea id="lz_chat_text" onkeydown="parent.parent.lz_switch_title_mode(false);if(event.keyCode==13){return parent.parent.lz_chat_message('','');}else{parent.parent.setTimeout('lz_chat_switch_extern_typing(true);',3000);return true;}"></textarea>
        </div>
        <div id="lz_chat_subline" style="left:10px;top:-5px;">
            <div id="lz_chat_operator_typing_info"></div>
        </div>
        <input type="button" id="lz_chat_submit" onclick="return parent.parent.lz_chat_message('','');" name="lz_send_button" value="" title="<!--lang_client_send-->">
    </div>
</body>
</html>
