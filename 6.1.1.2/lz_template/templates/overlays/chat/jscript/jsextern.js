var lz_chat_full_load = true;
var lz_chat_status_change = true;
var lz_chat_status = -1;
var lz_chat_last_post_received = null;
var lz_chat_last_message_received = null;
var lz_chat_last_poster = null;
var lz_operator = null;
var lz_sound_available = false;
var lz_sound_player = null;
var lz_external = new lz_chat_external_user();
var lz_chat_data = new lz_chat_data_box();
var lz_chat_change_data = false;
var lz_chat_connecting = false;
var lz_ticket = null;
var lz_flood = false;
var lz_timer_typing = null;
var lz_timer_connecting = null;
var lz_header_text = "";
var lz_header_bot_text = "";
var lz_sound_format = "ogg";
var lz_chat_id = "";
var lz_closed = false;
var lz_popped_out = false;
var lz_chat_waiting_posts_timer;
var lz_chat_invite_timer = null;
var lz_desired_operator = null;
var lz_desired_group = null;
var lz_last_post = "";
var lz_chat_talk_to_human = false;
var lz_chat_scrolled = false;
var lz_chat_botmode = false;
var lz_leave_chat = false;
var lz_chat_resize_interval = null;
var lz_chat_resize_no_change = 0;
var lz_chat_logged_in = false;
var lz_chat_human_available = false;
var lz_chat_delined = false;
var lz_chat_init_feedback = false;
var lz_mode_show_options = false;
var lz_chat_option_function;
var lz_chat_kb_last_search_phrase = "";
var lz_chat_kb_search_phrase = "";
var lz_chat_kb_sound_played = false;
var lz_default_meta = null;

function lz_chat_resize_area_int(_id,_maxSize,_minSize)
{
    if(lz_chat_resize_interval == null){lz_chat_resize_no_change=0;lz_chat_resize_interval = setInterval("lz_chat_resize_area('" + _id + "',"+_maxSize+","+_minSize+");", 50);}return true;
}

function lz_chat_resize_area(_id,_maxSize,_minSize)
{
    try{
        lz_chat_resize_no_change++;
        var current = (document.getElementById(_id).style.height != "") ? parseInt(document.getElementById(_id).style.height.replace("px","")) : _minSize;
        if(lz_chat_resize_no_change > 100){clearInterval(lz_chat_resize_interval);lz_chat_resize_interval = null;}
        if(current > _maxSize){document.getElementById(_id).style.height = _maxSize + "px";return;}
        if(current < _minSize){document.getElementById(_id).style.height = _minSize + "px";return;}
        if(document.getElementById(_id).style.height != "")
        {
            var difb = current - _minSize;
            var difs = lz_overlay_chat_height_extended - (lz_overlay_chat_height + difb);
            lz_overlay_chat_height_extended = lz_overlay_chat_height + difb;

            if(difs != 0)
            {
                lz_overlay_chat.lz_livebox_extended_pos("lz_overlay_chat",difs);
                lz_chat_update_css();
                lz_chat_resize_no_change = 0;
            }
        }}catch(ex){}
}

function lz_chat_unset_focus()
{
    try
    {
        if(lz_chat_data.InputFieldIndices != null)
        {
            if(document.getElementById("lz_chat_data_form").style.display != "none")
            {
                for(var i = 0;i< lz_chat_data.InputFieldIndices.length;i++)
                {
                    var findex = lz_chat_data.InputFieldIndices[i];
                    if(document.getElementById('lz_form_'+findex) != null && document.getElementById('lz_form_'+findex).style.display != 'none')
                    {
                        document.getElementsByName('form_'+findex)[0].blur();
                    }

                }
            }
            else
                document.getElementById('lz_chat_text').blur();
        }
    }
    catch(ex){}
}

function lz_chat_set_focus(_call)
{
    try
    {
        if(document.getElementById("lz_chat_overlay_options_box").style.display != "none" || document.getElementById('lz_chat_overlay_loading').style.display=="" || lz_mode_show_options)
        {
            return;
        }

        if(lz_chat_state_expanded && lz_chat_data.InputFieldIndices != null)
        {
            var input = null;
            if(document.getElementById("lz_chat_data_form").style.display != "none")
            {
                for(var i = 0;i< lz_chat_data.InputFieldIndices.length;i++)
                {
                    var findex = lz_chat_data.InputFieldIndices[i];
                    if(document.getElementById('lz_form_'+findex) != null && document.getElementById('lz_form_'+findex).style.display != 'none')
                        if(document.getElementsByName('form_'+findex)[0].value == "")
                        {
                            input = document.getElementsByName('form_'+findex)[0];
                            break;
                        }
                }
            }
            else
            {
                input = document.getElementById('lz_chat_text');
            }
            if(input != null)
                lz_chat_set_focus_ctrl(input);
        }
    }
    catch(ex){
    }
}

function lz_chat_set_focus_ctrl(_ctrl)
{
    try
    {
        _ctrl.focus();
        var val = _ctrl.value;
        _ctrl.value = '';
        _ctrl.value = val;

    }
    catch(ex){

    }
}

function lz_chat_scoll_down()
{
    setTimeout("document.getElementById('lz_chat_content_box').scrollTop = document.getElementById('lz_chat_content_box').scrollHeight;",100);
}

function lz_chat_pop_out(_knowledgebase)
{
    var group = (lz_chat_data.SelectedGroup != null) ? lz_global_base64_url_encode(lz_chat_data.SelectedGroup.Id) : "";
    var operator = "";

    if(lz_chat_id.length > 0)
        operator = (lz_desired_operator != null) ? lz_global_base64_url_encode(lz_desired_operator) : "";

    var params = "";
    var question = (lz_chat_get_input_value(114) != "") ? lz_global_base64_url_encode(lz_chat_get_input_value(114)) : lz_global_base64_url_encode(lz_last_post);
    if(lz_chat_data.InputFieldValues != null)
    {
        for(var i=0;i<lz_chat_data.InputFieldValues.length;i++)
            if(lz_chat_data.InputFieldValues[i].Type != "File" && lz_chat_data.InputFieldValues[i].Value != '')
                params += "&f" + lz_chat_data.InputFieldIndices[i] +"="+ lz_global_base64_url_encode(lz_chat_data.InputFieldValues[i].Value);
    }
    lz_closed = lz_popped_out = true;
    if(lz_chat_id.length > 0 && !lz_chat_botmode)
    {
        params += "&dl=MQ__&acid="+lz_global_base64_url_encode(lz_chat_id)+"&i="+lz_global_base64_url_encode(lz_session.UserId);
        lz_tracking_poll_server(1111);
    }
    else
    {
        params += "&mp=MQ_";
        if(document.getElementById("lz_chat_invite_id") != null)
            lz_chat_decline_request(lz_request_active=document.getElementById("lz_chat_invite_id").value,false,false,true);
    }
    if(question.length>0)
        params += "&eq=" + question;
    if(_knowledgebase)
        params += "&t=" + lz_global_base64_url_encode("kb");
    params += "&epc=" + lz_global_base64_url_encode(lz_color);
    lz_chat_change_state(true,true);
    lz_tracking_init_external_window('',operator,group,params,false);
}

function lz_chat_switch_details(_cancel)
{
    if(!_cancel && lz_mode_change_details)
    {
        if(lz_chat_data.CurrentApplication=="chat")
        {
            var _name = lz_chat_get_input_value(111);
            if(lz_global_trim(_name) == "")
                _name = lz_guest_name;

            for(var i=0;i<document.getElementById("lz_chat_content_box").getElementsByTagName("TD").length;i++)
                if(document.getElementById("lz_chat_content_box").getElementsByTagName("TD")[i].className == "operator_name")
                    document.getElementById("lz_chat_content_box").getElementsByTagName("TD")[i].innerHTML = lz_global_htmlentities(_name);

            lz_chat_change_data = true;
            lz_tracking_poll_server(1112);
        }
    }
    lz_mode_change_details = !lz_mode_change_details;
    lz_chat_prepare_data_form();
    lz_chat_set_focus(1);
}

function lz_chat_replace_time()
{
    for(var i=0;i<document.getElementById("lz_chat_content_box").getElementsByTagName("div").length;i++)
        if(document.getElementById("lz_chat_content_box").getElementsByTagName("div")[i].className == "lz_overlay_chat_message_time")
        {
            if(document.getElementById("lz_chat_content_box").getElementsByTagName("div")[i].innerHTML.indexOf(":") == -1)
            {
                document.getElementById("lz_chat_content_box").getElementsByTagName("div")[i].innerHTML = lz_global_get_time(document.getElementById("lz_chat_content_box").getElementsByTagName("div")[i].innerHTML);
            }
        }

}

function lz_chat_switch_options_table(_forceClose)
{
    document.getElementById('lz_chat_options_table').style.display = (document.getElementById('lz_chat_options_table').style.display=='none' && !_forceClose) ? '' : 'none';

    document.getElementById("lz_chat_overlay_bottom").style.opacity =
        document.getElementById("lz_chat_content_box").style.opacity = (document.getElementById('lz_chat_options_table').style.display!='none') ? 0.4 : 1;


}

function lz_chat_switch_options(_function,_cancel)
{
    var functions = ["so","fu","tr","et"];
    if(!_cancel)
    {
        lz_chat_unset_focus();
        var show = document.getElementById("lz_chat_overlay_options_box").style.display == "none";
        document.getElementById('lz_chat_overlay_options_sound').disabled = !lz_sound_available;

        for(var i = 0;i<functions.length;i++)
            document.getElementById('lz_chat_overlay_option_function_' + functions[i]).style.display = (_function == functions[i]) ? "block" : "none";

        if(show)
        {
            lz_chat_option_function = _function;
            if(_function=="fu")
            {
                if(document.getElementById('lz_chat_overlay_file_upload_frame').src != lz_poll_server+"upload.php?cid="+ lz_global_base64_url_encode(lz_chat_id))
                    document.getElementById('lz_chat_overlay_file_upload_frame').src = lz_poll_server+"upload.php?cid="+ lz_global_base64_url_encode(lz_chat_id);
            }
            else if(_function=="tr")
            {



            }
            else if(_function=="so")
            {

                document.getElementById('lz_chat_overlay_options_sound').checked = lz_sound_available && lz_session.OVLCSound==1;

            }
            else if(_function=="et")
            {
                if(lz_session.Transcript != -1)
                    document.getElementById('lz_chat_overlay_options_transcript').checked = lz_session.Transcript==1;

                document.getElementById('lz_chat_overlay_options_transcript_email').value = lz_chat_get_input_value(112);
                document.getElementById('lz_chat_overlay_options_transcript_email').disabled = !document.getElementById('lz_chat_overlay_options_transcript').checked;
            }

        }
        else
        {
            if(_function=="so")
            {
                lz_session.OVLCSound = (document.getElementById('lz_chat_overlay_options_sound').checked) ? 1 : 0;
            }
            if(_function=="et")
            {
                lz_session.Transcript = (document.getElementById('lz_chat_overlay_options_transcript').checked) ? 1 : 0;

                if(document.getElementById('lz_chat_overlay_options_transcript').checked)
                    document.getElementsByName("form_112")[0].value = document.getElementById('lz_chat_overlay_options_transcript_email').value;
            }

            lz_chat_init_data_change(lz_global_trim(document.getElementById('lz_chat_overlay_options_transcript_email').value));
            lz_session.Save();
        }
        lz_mode_show_options = show;
        lz_chat_fade_options(show);
    }
    else
    {
        lz_chat_fade_options(false);
    }
}

function lz_chat_fade_options(_in)
{
    try
    {
        var top = parseInt((lz_overlay_chat_height - 80) - parseInt(document.getElementById("lz_chat_overlay_options_box").style.height.replace("px","")));
        document.getElementById("lz_chat_overlay_options_box").style.top = (top/2) + "px";
        document.getElementById("lz_chat_overlay_options_frame").style.display = "";
        if(_in)
        {
            document.getElementById("lz_chat_overlay_options_box_bg").style.display = (_in) ? "" : "none";
            document.getElementById("lz_chat_overlay_options_box").style.display = (_in) ? "" : "none";
        }
        var current = parseFloat(document.getElementById("lz_chat_overlay_options_box").style.opacity);
        if((_in && current < 1) || (!_in && current>0))
        {
            current = (_in) ? (current+0.1) : (current-0.1);

            if(!_in && current<0.2)
                current = 0;

            document.getElementById("lz_chat_overlay_options_box").style.opacity = current;

            if(current < 0.9)
                document.getElementById("lz_chat_overlay_options_box_bg").style.opacity = current;
            setTimeout("lz_chat_fade_options("+((_in) ? 'true' : 'false')+");",20);
        }
        else if(!_in)
        {
            document.getElementById("lz_chat_overlay_options_box_bg").style.display = (_in) ? "" : "none";
            document.getElementById("lz_chat_overlay_options_box").style.display = (_in) ? "" : "none";
            document.getElementById("lz_chat_overlay_options_frame").style.display = "none";
            lz_chat_set_focus(2);
        }
    }
    catch(ex)
    {


    }
}

function lz_chat_init_data_change(_email)
{
    var _name = lz_chat_get_input_value(111);
    if(_email==null)
        _email = lz_chat_get_input_value(112);
    if(lz_chat_data.InputFieldIndices != null)
    {
        lz_chat_get_input(111).ChangeDataTo = _name;
        lz_chat_get_input(112).ChangeDataTo = _email;
        lz_chat_save_input_value(112,_email);
        lz_chat_save_input_value(111,_name);

    }
    lz_chat_change_data = true;
}

function lz_chat_play_sound(_file)
{
    if(lz_sound_available && document.getElementById('lz_chat_overlay_options_sound').checked)
    {
        if(lz_sound_player == null)
            lz_sound_player = new Audio(lz_poll_server + "sound/"+_file+"." + lz_sound_format);
        lz_sound_player.play();
    }
}

function lz_chat_set_talk_to_human(_value,_poll)
{
    lz_chat_input_bot_state(false,false);
    lz_chat_talk_to_human = _value;
    if(_poll && _value && !lz_chat_delined)
    {
        lz_tracking_poll_server(1119);
        lz_chat_set_focus(13);
    }
}

function lz_chat_input_bot_state(_botmode,_hide)
{
    lz_chat_botmode = _botmode;
    document.getElementById("lz_chat_text").style.display = (_hide) ? 'none' : '';
    document.getElementById("lz_chat_bot_reply_loading").style.display = (!_hide || !_botmode) ? 'none' : '';
    if(_botmode && !_hide)
        setTimeout("lz_chat_set_focus(11);",200);
}

function lz_chat_message(_msg,_trans)
{
    if(!lz_chat_change_data && lz_chat_status == 0)
        lz_chat_change_data = true;

    lz_closed = false;
    var msg = (_msg==null) ? lz_global_trim(document.getElementById("lz_chat_text").value) : _msg;
    if(msg.length>0 && lz_chat_botmode)
        lz_chat_input_bot_state(true,true);
    var transInto = (lz_session.TransInto!=""&&lz_session.TransInto!=null) ? lz_session.TransInto : "";
    if(lz_tr_api_key != '' && transInto != '' && lz_session.TransFrom!=null && lz_session.TransFrom!="" && lz_session.TransFrom.toUpperCase() != transInto.toUpperCase() && _msg==null)
    {
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        var sourceText = encodeURI(msg);

        window.doneTranslateCallback = function translateText(response){if(response.data!=null){lz_chat_message(msg,response.data.translations[0].translatedText);window.doneTranslateCallback=null;}else{alert("Sorry, there was an error while trying to translate:\r\n" + JSON.stringify(response));lz_chat_message(msg,null);}}
        var source = "https://www.googleapis.com/language/translate/v2?key="+lz_global_base64_decode(lz_tr_api_key)+"&format=html&source="+lz_session.TransFrom+"&target="+transInto+"&callback=doneTranslateCallback&q=" + msg;
        newScript.src = source;
        document.getElementsByTagName("head")[0].appendChild(newScript);
        document.getElementById("lz_chat_text").value = '';
        return false;
    }

    if(msg.length>0)
    {
        if(document.getElementById("lz_chat_invite_id") != null && lz_chat_status == 0)
        {
            lz_chat_decline_request(lz_request_active=document.getElementById("lz_chat_invite_id").value,true,false,true);

            if(msg.length > document.getElementsByName("form_114")[0].value.length)
                document.getElementsByName("form_114")[0].value = msg;
            lz_chat_start();
            return false;
        }

        var html = "";
        var msgo = new lz_chat_post();
        if(_trans != null)
        {
            msgo.MessageTranslationText =_trans;
            html = lz_global_htmlentities(msgo.MessageTranslationText) + "<div class='lz_overlay_translation'>" + lz_global_htmlentities(msg) + "</div>";
        }
        else
            html = lz_global_htmlentities(msg);

        msgo.MessageText = msg;
        msgo.MessageId = lz_global_microstamp();
        msgo.MessageTime = lz_global_timestamp();
        lz_external.MessagesSent[lz_external.MessagesSent.length] = msgo;
        document.getElementById("lz_chat_text").value = '';

        if(lz_operator==null)
            lz_chat_set_connecting(true,null,false);

        var posthtml = (lz_chat_last_poster != lz_external.Id) ? lz_global_base64_decode(lz_post_html) : lz_global_base64_decode(lz_add_html);
        posthtml = posthtml.replace("<!--message-->",html);
        posthtml = posthtml.replace("<!--time-->",lz_global_timestamp());
        posthtml = posthtml.replace("<!--name-->",(lz_chat_get_input_value(111).length == 0) ? lz_guest_name : lz_global_htmlentities(lz_chat_get_input_value(111)));
        lz_chat_add_html_element(lz_global_base64_encode(posthtml),false,null,null,lz_global_base64_encode(lz_external.Id),null);
        lz_tracking_poll_server(1114);
        lz_chat_set_focus(6);
    }
    return false;
}

function lz_chat_set_group(_groupId)
{
    lz_desired_group = lz_global_base64_decode(_groupId);
    if(lz_chat_data.Groups != null)
    {
        lz_chat_data.SelectedGroup = lz_chat_data.Groups.GetGroupById(lz_desired_group);
        lz_chat_data.Groups.SelectGroupById(lz_chat_data.SelectedGroup.Id,document.getElementById("lz_form_groups"));
    }
}

function lz_chat_set_host(_systemId,_chatId,_groupId,_groupName,_userid,_lang,_image,_fullname,_functions)
{
    if(lz_overlay_chat != null)
    {
        lz_chat_id = lz_global_base64_decode(_chatId);
        if(_lang != null && lz_session.TransInto == "")
        {
            lz_session.TransInto = lz_global_base64_decode(_lang);
            lz_session.Save();
        }
        if(_systemId != null)
        {
            if(!lz_chat_botmode)
                lz_chat_set_state_bar(true);
            lz_operator = new lz_chat_operator();
            lz_operator.Id = lz_global_base64_decode(_systemId);
            lz_operator.Group = lz_global_base64_decode(_groupId);
            lz_operator.Fullname = lz_global_base64_decode(_fullname);
            lz_desired_operator = lz_global_base64_decode(_userid);
        }
        else
        {
            lz_chat_set_state_bar(false);
            lz_desired_operator = null;
            lz_external.MessagesSent = new Array();
            lz_operator = null;
        }

        document.getElementById("lz_cf_so").style.display = (_functions != null && _functions[1]==0) ? 'none' : 'block';
        document.getElementById("lz_cf_pr").style.display = (_functions != null && _functions[2]==0) ? 'none' : 'block';
        document.getElementById("lz_cf_fu").style.display = (_functions != null && _functions[5]==0) ? 'none' : 'block';
        document.getElementById("lz_chat_feedback_init").style.display = (_functions != null && _functions[3]==0) ? 'none' : 'block';

        if(_functions != null && _functions[1]==0)
            lz_sound_available = false;


        if(_image != null)
            document.getElementById("lz_chat_state_image").style.backgroundImage = "url('"+lz_global_base64_decode(_image)+"')";

        document.getElementById("lz_chat_operator_fullname").innerHTML = (lz_operator != null) ? lz_operator.Fullname : "";
        document.getElementById("lz_chat_operator_groupname").innerHTML = (lz_operator != null) ? lz_global_base64_decode(_groupName) : "";
    }
}

function lz_chat_set_state_bar(_visible)
{
    if(lz_overlay_chat != null)
    {
        if(_visible)
        {
            document.getElementById("lz_chat_content_box").style.top = "87px";
            document.getElementById("lz_chat_state_bar").style.display = "block";
        }
        else
        {
            document.getElementById("lz_chat_content_box").style.top = "6px";
            document.getElementById("lz_chat_state_bar").style.display = "none";
        }
    }
}

function lz_chat_close()
{
    lz_chat_logged_in = false;
    lz_leave_chat = true;
    lz_chat_set_state_bar(false);
    lz_tracking_poll_server(1120);
}

function lz_chat_print()
{
    var pURL = lz_poll_server + "print.php?c=" + lz_global_base64_url_encode(lz_chat_id) + "&b=" + lz_global_base64_url_encode(lz_session.UserId+"_OVL") + "&i=" + lz_global_base64_url_encode(lz_session.UserId) + "&r=" + Math.random().toString();
    void(window.open(pURL,'LiveZilla','width=400,height=600,left=50,top=50,resizable=yes,menubar=no,location=no,status=yes,slidebars=no'));
}

function lz_chat_set_typing(_typingText,_fromTimer)
{
    if(lz_overlay_chat != null)
    {
        var bclass = false;
        if(lz_chat_connecting)
        {
            if(!_fromTimer && lz_timer_connecting != null)
                return;

            if(document.getElementById("lz_chat_overlay_info").innerHTML.length == 0)
            {
                bclass= true;
                document.getElementById("lz_chat_overlay_info").innerHTML = lz_text_connecting_info;
            }
            else
            {
                document.getElementById("lz_chat_overlay_info").innerHTML = "";
            }
            lz_timer_connecting = setTimeout("lz_chat_set_typing('',true);",700);
        }
        else
        {
            if(lz_timer_connecting != null)
                clearTimeout(lz_timer_connecting);
            lz_timer_connecting = null;
            bclass = _typingText != null;
            document.getElementById("lz_chat_overlay_typing_info").innerHTML = (_typingText != null) ? lz_global_base64_decode(_typingText) : "";
        }
        document.getElementById("lz_chat_content_box").style.bottom = (lz_chat_connecting) ? "102px" : "80px";
        document.getElementById("lz_chat_overlay_info").className = (bclass) ? "lz_con_inf" : "";
        document.getElementById("lz_chat_overlay_loading_bar").style.display = (lz_chat_connecting) ? "block" : "none";
        document.getElementById("lz_chat_overlay_info").style.display = (lz_chat_connecting) ? "block" : "none";
    }
}

function lz_chat_switch_extern_typing(_typing)
{
    var announce = (_typing != lz_external.Typing);
    if(_typing)
    {
        if(lz_timer_typing != null)
            clearTimeout(lz_timer_typing);
        lz_timer_typing = setTimeout("lz_chat_switch_extern_typing(false);",5000);
    }
    lz_external.Typing = _typing;
    if(announce && lz_operator != null)
        lz_tracking_poll_server(1115);
}

function lz_chat_show_waiting_message(_html)
{
    if(lz_chat_status < 2)
        lz_chat_add_html_element(_html,false,null,null,"sys",null);
}

function lz_chat_set_connecting(_connecting,_id,_hidePopOut,_waitingHTML,_waitingDelay)
{
    if(_id != null)
        lz_external.Id = _id;
    if(_connecting && lz_chat_data.TimerWaiting==null && _waitingHTML != null)
        lz_chat_data.TimerWaiting = setTimeout("lz_chat_show_waiting_message('"+_waitingHTML+"');",_waitingDelay*1000);
    else if(!_connecting && lz_chat_data.TimerWaiting != null)
    {
        clearTimeout(lz_chat_data.TimerWaiting);
        lz_chat_data.TimerWaiting = null;
    }

    lz_chat_connecting = _connecting;
    if(_connecting)
        lz_chat_set_typing(null,false);
    if(document.getElementById("lz_chat_apo") != null)
        document.getElementById("lz_chat_apo").style.visibility = (_hidePopOut) ? "hidden" : "visible";

    //if(_connecting)
    //  lz_chat_input_bot_state(true,true);
}

function lz_chat_set_last_post(_post)
{
    lz_last_post = lz_global_base64_decode(_post);
}

function lz_chat_require_leave_message()
{
    lz_ticket_when_online = true;
    if(lz_chat_handle_ticket_forward(true))
        return;
    lz_mode_create_ticket = true;
    lz_chat_close();
    if(document.getElementById('lz_chat_text').value.length > 0 && document.getElementsByName("form_114")[0].value.length == 0)
        document.getElementsByName("form_114")[0].value = document.getElementById('lz_chat_text').value;
    else if(lz_last_post.length > 0 && document.getElementsByName("form_114")[0].value.length == 0)
        document.getElementsByName("form_114")[0].value = lz_last_post;
    lz_chat_prepare_data_form();
    lz_chat_set_focus(65);
}

function lz_chat_message_return()
{
    lz_mode_create_ticket = false;
    if(!lz_chat_delined)
        lz_chat_set_application(true, lz_chat_botmode);
}

function lz_chat_prepare_data_form()
{
    lz_chat_set_input_fields();

    if(lz_chat_data.SelectedGroup == null)
        return;

    var showCancelButton = lz_chat_data.CurrentApplication=="chat" && (lz_chat_data.SelectedGroup.Amount > 0 || lz_mode_change_details);
    var hideOkButton = lz_mode_change_details || (!lz_ticket_when_online && lz_chat_data.CurrentApplication=="chat" && lz_chat_data.SelectedGroup.Amount > 0);

    document.getElementById("lz_chat_overlay_data_form_cancel_button").style.display = (showCancelButton) ? "" : "none";
    document.getElementById("lz_chat_overlay_data_form_cancel_button").innerHTML = (lz_chat_data.CurrentApplication=="chat" && lz_mode_change_details) ? lz_text_save : (lz_chat_status>0) ? lz_text_back : lz_text_start_chat;
    document.getElementById('lz_chat_overlay_data_form_ok_button').style.display = (hideOkButton) ? "none" : "";
    document.getElementById('lz_chat_overlay_data_form_ok_button').className = (true) ? "lz_chat_overlay_options_box_base lz_overlay_chat_button unselectable" : "lz_chat_overlay_options_box_base lz_overlay_chat_button lz_overlay_light_button unselectable";
    document.getElementById('lz_chat_data_form_header_title').innerHTML = (lz_chat_data.CurrentApplication=="chat" && lz_chat_data.SelectedGroup.Amount > 0) ? lz_text_chat_header : lz_text_ticket_header;
    document.getElementById('lz_chat_data_form_header_text').innerHTML = (lz_chat_data.CurrentApplication=="chat" && !lz_mode_create_ticket && lz_chat_data.SelectedGroup.Amount > 0) ? ((lz_mode_change_details && !lz_mode_create_ticket) ? "" : lz_text_chat_information) : lz_text_ticket_information;
    document.getElementById('lz_chat_data_form_header_title').className = (lz_chat_data.CurrentApplication=="chat" && lz_chat_data.SelectedGroup.Amount > 0) ? "lz_chat_status_online" : "lz_chat_status_offline";
    document.getElementById("lz_chat_data_form_header_text").style.display = (lz_chat_data.CurrentApplication=="ticket"||lz_mode_create_ticket||!lz_mode_change_details) ? "" : "none";
    document.getElementById("lz_chat_data_form_header_title").style.display = (lz_chat_data.CurrentApplication=="ticket"||lz_mode_create_ticket||!lz_mode_change_details) ? "" : "none";
    document.getElementById('lz_chat_data_header').style.visibility = (lz_chat_data.CurrentApplication=="ticket"||lz_mode_create_ticket||!lz_mode_change_details) ? "visible" : "hidden";
    document.getElementById("lz_chat_overlay_ticket").style.display = (lz_mode_ticket_feedback) ? "" : "none";
    document.getElementById("lz_chat_content_box").style.display = (lz_chat_data.CurrentApplication=="chat") ? "" : "none";
    document.getElementById("lz_chat_data_form").style.display = (document.getElementById("lz_chat_invite_id") == null && !lz_mode_ticket_feedback && (lz_chat_data.CurrentApplication!="chat" || lz_mode_create_ticket || lz_mode_change_details || (lz_mode_chat_login && lz_chat_status==0 && !lz_chat_logged_in))) ? "" : "none";
    document.getElementById("lz_chat_ticket_received").style.display = (lz_mode_ticket_feedback && !lz_flood) ? "" : "none";
    document.getElementById('lz_chat_text').disabled = (document.getElementById("lz_chat_data_form").style.display != "none");
    document.getElementById("lz_chat_overlay_data_form_cancel_button").style.backgroundImage = (!lz_mode_change_details) ? "url('"+lz_poll_server+"templates/overlays/chat/images/icon_chat.png')" : "";
    document.getElementById("lz_chat_overlay_data_form_ok_button").style.backgroundImage = (true) ? "url('"+lz_poll_server+"templates/overlays/chat/images/icon_ticket.png')" : "";

    if(lz_text_ticket_information == document.getElementById('lz_chat_data_form_header_text').innerHTML && lz_chat_data.SelectedGroup != null && lz_chat_data.SelectedGroup.TicketInformation.length > 0)
        document.getElementById('lz_chat_data_form_header_text').innerHTML += "<br>" + lz_chat_data.SelectedGroup.TicketInformation;

    if(lz_text_chat_header == document.getElementById('lz_chat_data_form_header_text').innerHTML && lz_chat_data.SelectedGroup != null && lz_chat_data.SelectedGroup.ChatInformation.length > 0)
        document.getElementById('lz_chat_data_form_header_text').innerHTML += "<br>" + lz_chat_data.SelectedGroup.ChatInformation;

    var title = "";
    if(lz_chat_data.CurrentApplication == "chat" && lz_chat_botmode && lz_header_bot_text != '' && !lz_mode_chat_login && !lz_mode_create_ticket)
        title = lz_header_bot_text;
    else
        title = (lz_chat_data.CurrentApplication=="chat" && (lz_chat_data.SelectedGroup.Amount > 0 || lz_chat_status > 0)) ? lz_header_online : lz_header_offline;

    document.getElementById("lz_chat_overlay_text").innerHTML = lz_global_base64_decode(title);
}

function lz_chat_data_form_result(_ok)
{
    document.getElementById("lz_form_mandatory").style.display='none';
    if(_ok)
    {
        lz_check_missing_inputs(false);
        lz_chat_send_ticket();
    }
    else
    {
        if(lz_mode_ticket_feedback)
        {
            lz_mode_create_ticket = true;
            lz_mode_ticket_feedback = false;
            lz_chat_prepare_data_form();
            lz_chat_set_focus(7);
        }
        else if(lz_mode_change_details)
            lz_chat_switch_details(false);
        else if(lz_chat_data.CurrentApplication=="chat")
            lz_chat_start();
    }
}

function lz_chat_start()
{
    lz_mode_create_ticket = false;
    if(lz_chat_status > 0 || (lz_chat_status == 0 && lz_check_missing_inputs(true,'lz_chat_start')))
    {
        lz_chat_change_data = true;
        lz_chat_loading(false);
        if(document.getElementsByName("form_114")[0].value.length > 0 && lz_chat_status == 0)
        {
            document.getElementById('lz_chat_text').value = document.getElementsByName("form_114")[0].value;
            lz_chat_message(null,null);
            document.getElementById('lz_chat_text').value = "";
        }
        lz_chat_logged_in = true;
    }
    lz_chat_prepare_data_form();
    lz_chat_set_focus(8);
}

function lz_chat_set_application(_chat,_bot,_human,_title,_chatStatus,_declined)
{
    if(lz_overlay_chat != null)
    {
        var isChat = (lz_chat_data.CurrentApplication=="chat");
        lz_chat_status = _chatStatus;
        lz_chat_delined = _declined;

        lz_chat_human_available = _human;
        if(lz_operator != null || lz_chat_connecting)
            _chat = true;
        if(lz_mode_change_details && _chat != isChat)
            lz_chat_switch_details(true);

        if(!isChat && _chat && document.getElementsByName("form_114")[0].value.length > 0)
            lz_mode_create_ticket = true;
        else if(!_chat && document.getElementById('lz_chat_text').value.length > 0 && document.getElementsByName("form_114")[0].value.length == 0)
            document.getElementsByName("form_114")[0].value = document.getElementById('lz_chat_text').value;

        if(!lz_chat_delined && !lz_mode_create_ticket && lz_chat_data.SelectedGroup != null && lz_chat_data.SelectedGroup.Amount > 0)
            _chat = true;

        lz_chat_change_widget_application(_chat);

        if(_title != '')
            lz_header_bot_text = _title;

        if(lz_eye_catcher != null)
        {
            if(lz_ec_type==2 && document.getElementById("lz_ec_image")!=null)
            {
                document.getElementById("lz_ec_image").src = lz_global_base64_url_decode(((_chat) ? lz_ec_image : lz_ec_o_image));
            }
            else if(lz_ec_type==1)
            {
                document.getElementById("lz_ec_header_text").innerHTML = lz_global_base64_url_decode((_chat) ? lz_ec_header : lz_ec_o_header);
                document.getElementById("lz_ec_sub_header_text").innerHTML = lz_global_base64_url_decode((_chat) ? lz_ec_sub_header : lz_ec_o_sub_header);
            }
        }

        if(!_chat && document.getElementById("lz_chat_queued_posts") != null)
            document.getElementById("lz_chat_content_box").removeChild(document.getElementById("lz_chat_queued_posts"));

        lz_chat_data.CurrentApplication = (_chat) ? "chat" : "ticket";

        document.getElementById("lz_chat_overlay_icon").style.backgroundImage = (_chat) ? "url('"+lz_poll_server+"templates/overlays/chat/images/icon_chat.png')" : "url('"+lz_poll_server+"templates/overlays/chat/images/icon_ticket.png')";

        lz_chat_prepare_data_form();

        if(isChat != _chat || lz_is_mobile)
            lz_chat_set_element_width();
        if(isChat != _chat)
            lz_chat_scoll_down();
    }
}

function lz_chat_poll_parameters()
{
    var params = "";
    if(lz_operator != null)
        params += "&op=" + lz_global_base64_url_encode(lz_operator.Id);

    if(lz_external.Typing)
        params += "&typ=1";

    if(lz_chat_full_load && !lz_chat_delined)
        params += "&full=1";

    if(lz_closed || lz_leave_chat)
        params += "&clch=MQ__";

    if(lz_popped_out)
        params += "&po=MQ__";

    if(lz_chat_init_feedback)
    {
        lz_chat_init_feedback = false;
        params += "&ovlif=MQ__";
    }

    if(lz_chat_kb_search_phrase != "")
        params += "&skb=" + lz_global_base64_url_encode(lz_chat_kb_search_phrase);

    if(lz_chat_status_change)
        params += "&sc=1";

    if(lz_chat_talk_to_human && !lz_chat_delined)
        params += "&tth=MQ__";

    if(lz_force_monitoring)
        params += "&fm=MQ__";

    if(lz_chat_data.SelectedGroup != null)
        params += "&eg=" + lz_global_base64_url_encode(lz_chat_data.SelectedGroup.Id);

    if(lz_chat_logged_in && lz_chat_status==0)
        lz_chat_change_data = true;

    if(lz_chat_change_data && lz_chat_data.InputFieldValues != null)
    {
        for(var i=0;i<lz_chat_data.InputFieldValues.length;i++)
            if(lz_chat_data.InputFieldValues[i].Type != "File" && lz_chat_data.InputFieldValues[i].Value != '')
                params += "&f" + lz_chat_data.InputFieldValues[i].Index +"="+ lz_global_base64_url_encode(lz_chat_data.InputFieldValues[i].Value);

        if(lz_chat_data.CurrentApplication=="chat")
            params += "&tc=" + lz_global_base64_url_encode(lz_session.Transcript.toString());

        lz_chat_change_data = false;
    }

    if(lz_ticket != null)
    {
        params += "&tid=" + lz_global_base64_url_encode(lz_ticket);
        lz_ticket = null;
    }

    lz_chat_status_change = false;
    if(lz_chat_last_post_received != null)
        params += "&lpr=" + lz_global_base64_url_encode(lz_chat_last_post_received);
    if(lz_chat_last_message_received != null)
        params += "&lmr=" + lz_global_base64_url_encode(lz_chat_last_message_received);
    if(lz_chat_last_poster != null)
        params += "&lp=" +lz_global_base64_url_encode(lz_chat_last_poster);
    if(lz_desired_operator != null)
        params += "&intid="+lz_global_base64_url_encode(lz_desired_operator);


    var count=0;
    for(var i=0;i<lz_external.MessagesSent.length;i++)
        if(!lz_external.MessagesSent[i].Received)
            params+="&mi" + count.toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageId) + "&mp" + (count).toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageText)+ "&mpt" + (count).toString() + "=" + lz_global_base64_url_encode(lz_external.MessagesSent[i].MessageTranslationText)+ "&mpti" + (count++).toString() + "=" + lz_global_base64_url_encode((lz_session.TransFrom!=null)?lz_session.TransFrom:"");

    return params;
}

function lz_overlay_chat_impose_max_length(_object, _max)
{
    if(_object.value.length > _max)
        _object.value = _object.value.substring(0,_max);
}

function lz_chat_release_post(_id)
{
    newMessageList = new Array();
    for(var mIndex in lz_external.MessagesSent)
        if(lz_external.MessagesSent[mIndex].MessageId == _id)
            lz_external.MessagesSent[mIndex].Received=true;
}

function lz_chat_update_waiting_posts(_wposts,_fromTimer)
{
    if(_wposts > -1 && lz_session.OVLCWM != _wposts)
    {
        lz_session.OVLCWM = _wposts;
        lz_session.Save();
    }
    document.getElementById("lz_chat_waiting_messages").style.display =
        document.getElementById("lz_chat_waiting_message_count").style.display = (!lz_chat_state_expanded && lz_session.OVLCWM > 0) ? "" : "none";
    document.getElementById("lz_chat_waiting_message_count").innerHTML = "&nbsp;"+lz_session.OVLCWM+"&nbsp;";
}

function lz_global_replace_smilies(_text)
{
    var shorts = new Array(/:-\)/g,/::smile/g,/:\)/g,/:-\(/g,/::sad/g,/:\(/g,/:-]/g,/::lol/g,/;-\)/g,/::wink/g,/;\)/g,/:'-\(/g,/::cry/g,/:-O/g,/::shocked/g,/:-\\\\/g,/::sick/g,/:-p/g,/::tongue/g,/:-P/g,/:\?/g,/::question/g,/8-\)/g,/::cool/g,/zzZZ/g,/::sleep/g,/:-\|/g,/::neutral/g);
    var images = new Array("smile","smile","smile","sad","sad","sad","lol","lol","wink","wink","wink","cry","cry","shocked","shocked","sick","sick","tongue","tongue","tongue","question","question","cool","cool","sleep","sleep","neutral","neutral");
    for(var i = 0;i<shorts.length;i++)
        _text = _text.replace(shorts[i]," <img border=0 src='"+lz_poll_server+"images/smilies/"+images[i]+".gif'> ");
    return _text;
}

function lz_chat_add_html_element(_html,_full,_lpr,_lmr,_lp,_ip,_posts)
{
    if(_posts != null)
        lz_chat_update_waiting_posts((_posts == -1) ? 0 : (lz_session.OVLCWM + parseInt(_posts)),false);

    if(_html != null)
    {
        if(lz_chat_full_load && _full)
            lz_chat_full_load = false;

        if(_ip != null && lz_global_base64_decode(_ip) != lz_chat_last_poster && lz_chat_last_poster != null)
        {
            lz_tracking_poll_server(1117);
            return;
        }

        if(_lpr != null && lz_chat_last_post_received != lz_global_base64_decode(_lpr))
            lz_chat_last_post_received = lz_global_base64_decode(_lpr);

        if(_lmr != null && lz_chat_last_message_received != lz_global_base64_decode(_lmr))
            lz_chat_last_message_received = lz_global_base64_decode(_lmr);

        if(_lp != null && _html != null && lz_chat_last_poster != lz_global_base64_decode(_lp))
            lz_chat_last_poster = lz_global_base64_decode(_lp);

        var dx = document.createElement("div");

        document.getElementById("lz_chat_content_inlay").appendChild(dx);
        dx.innerHTML = lz_global_replace_smilies(lz_global_base64_decode(_html),true);
        lz_update_chat_area();
        lz_chat_replace_time();
    }

}

function lz_update_chat_area()
{
    lz_chat_set_element_width();
    lz_chat_set_typing(null,false);

    var spacer = document.getElementById("xspacer");
    if(spacer != null)
        document.getElementById("lz_chat_content_box").removeChild(spacer);
    else
        spacer = document.createElement("div");

    spacer.style.height =
        spacer.style.lineHeight = "8px";
    spacer.id = "xspacer";
    document.getElementById("lz_chat_content_box").appendChild(spacer);
    lz_chat_scoll_down();
}

function lz_chat_post()
{
    this.MessageText = '';
    this.MessageTranslationText = '';
    this.MessageId = '';
    this.MessageTime = 0;
    this.Received = false;
}

function lz_chat_operator()
{
    this.Id = '';
    this.Fullname = '';
    this.Available = false;
    this.Group = '';
    this.Language = "en";
}

function lz_chat_external_user()
{
    this.Id = '';
    this.Username = '';
    this.Email = '';
    this.Company = '';
    this.Question = '';
    this.Typing = false;
    this.MessagesSent = new Array();
    this.MessagesReceived = new Array();
}

function lz_chat_detect_sound()
{
    var sa = document.createElement('audio');
    var avail_ogg = !!(sa.canPlayType && sa.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
    var avail_mp3 = !!(sa.canPlayType && sa.canPlayType('audio/mpeg;').replace(/no/, ''));
    lz_sound_available = (avail_ogg || avail_mp3);
    lz_sound_format = (avail_ogg) ? "ogg" : "mp3";
}

function lz_chat_decline_request(_id,_operator,_stateChange,_result)
{
    if(_result == null)
        _result = false;
    var node = document.getElementById(_id);
    if(node != null && node.style.display != 'none')
    {
        if(!_operator)
        {
            lz_request_active=_id;
            lz_tracking_action_result('chat_request',_result,false,lz_chat_poll_parameters());
        }
        node.parentNode.removeChild(node);
        if(_stateChange && lz_chat_state_expanded && lz_chat_id.length == 0 && lz_external.MessagesSent.length == 0)
            lz_chat_change_state(true,true);
        lz_chat_set_element_width();
    }
}

function lz_chat_mail_callback(_flood)
{
    lz_chat_loading(false);
    lz_mode_ticket_feedback = true;

    document.getElementById('lz_chat_ticket_received').style.display = (_flood) ? "" : "none";
    document.getElementById('lz_chat_ticket_flood').style.display = (!_flood) ? "" : "none";
    if(_flood)
    {
        document.getElementsByName("form_114")[0].value = "";
        lz_ticket = null;
    }
    else
        lz_flood = true;
    lz_chat_prepare_data_form();
}

function lz_chat_send_ticket()
{
    lz_chat_save_input_value(114,document.getElementsByName("form_114")[0].value);
    if(!lz_chat_handle_ticket_forward(true))
        if(lz_check_missing_inputs(true,'lz_chat_send_ticket'))
        {
            lz_chat_loading(true);
            lz_ticket = lz_global_timestamp();
            lz_chat_change_data = true;
            setTimeout("lz_tracking_poll_server(1116);",500);
        }
}

function lz_chat_loading(_loading)
{
    var change = (_loading != (document.getElementById('lz_chat_overlay_loading').style.display==""));
    document.getElementById('lz_chat_overlay_loading').style.display = (_loading) ? "" : "none";
    if(change)
    {
        if(_loading)
            lz_chat_unset_focus();
        else
            lz_chat_set_focus(43);
    }
}

function lz_check_missing_inputs(_display,_contFunc)
{
    var missingInput = false;
    var irequired = (lz_chat_data.CurrentApplication=="chat" && !lz_mode_create_ticket) ? lz_chat_data.SelectedGroup.ChatInputsMandatory : lz_chat_data.SelectedGroup.TicketInputsMandatory;
    var ihidden = (lz_chat_data.CurrentApplication=="chat" && !lz_mode_create_ticket) ? lz_chat_data.SelectedGroup.ChatInputsHidden : lz_chat_data.SelectedGroup.TicketInputsHidden;
    var isPlaceholderSupport = lz_is_placeholder_support();

    for(var i = 0;i < lz_chat_data.InputFieldIndices.length;i++)
    {
        var findex = lz_chat_data.InputFieldIndices[i];
        if(lz_chat_data.InputFieldValues[i].Type == "File" || findex == 115)
            continue;

        if(lz_chat_data.InputFieldValues[i].Active || (findex == 116 && lz_chat_data.CallMeBackMode))
        {
            var isFilled = (lz_chat_data.InputFieldValues[i].Type == "CheckBox") ? document.getElementsByName("form_" + findex)[0].checked : lz_global_trim(document.getElementsByName("form_" + findex)[0].value).length > 0;

            if(!isPlaceholderSupport && isFilled && lz_chat_data.InputFieldValues[i].Type != "CheckBox" && lz_global_trim(document.getElementsByName("form_" + findex)[0].value) == document.getElementById("lz_form_ph_" + findex).value)
                isFilled = false;

            var vvoucher = (findex == 115 && lz_chat_data.SelectedGroup.ChatVouchersRequired.length > 0 && lz_chat_data.CurrentApplication=="chat");
            var vrequired = (lz_array_indexOf(ihidden,findex) == -1 && (lz_array_indexOf(irequired,findex) != -1 || lz_chat_data.InputFieldValues[i].Validation));
            var vcallback = (findex == 116 && lz_chat_data.CallMeBackMode);
            var vquestion = (findex == 114 && _contFunc=="lz_chat_send_ticket");

            if(((vvoucher || vrequired) || vcallback || vquestion) && !isFilled)
            {
                if(_display)
                {
                    document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_required";
                    document.getElementById("lz_form_mandatory_" + findex).style.display = "";
                }
                missingInput = true;
            }
            else if(_display)
            {
                if(document.getElementById("lz_form_info_" + findex).innerHTML.length > 0)
                {
                    document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_info";
                    document.getElementById("lz_form_mandatory_" + findex).style.display = "";
                }
                else
                    document.getElementById("lz_form_mandatory_" + findex).style.display = "none";
            }
        }
    }

    var group = lz_chat_data.Groups.GetGroupById(document.getElementById('lz_form_groups').value);
    document.getElementById("lz_form_mandatory_group").className = "lz_input_icon lz_required";
    document.getElementById("lz_form_mandatory_group").style.display = (group == null && _display) ? "" : "none";

    if(group == null)
        missingInput = true;
    if(missingInput)
    {
        if(_display)
            document.getElementById("lz_form_mandatory").style.display='';
        return false;
    }
    else if(_contFunc != null)
        return lz_validate_inputs(_contFunc,ihidden);
    else
        return true;
}

function lz_validate_inputs(_contFunc,_hidden)
{
    lz_chat_data.ValidationRequired = false;
    for(var i = 0;i < lz_chat_data.InputFieldValues.length;i++)
    {
        lz_chat_data.InputFieldValues[i].SetStatus(null,false);
    }
    for(var i = 0;i < lz_chat_data.InputFieldValues.length;i++)
    {
        if(lz_chat_data.InputFieldValues[i].Active && lz_chat_data.InputFieldValues[i].Validation && !lz_chat_data.InputFieldValues[i].Validated && lz_array_indexOf(_hidden,lz_chat_data.InputFieldIndices[i]) == -1)
        {
            lz_chat_data.ValidationRequired = (lz_chat_data.InputFieldValues[i].Type != "CheckBox");
            lz_chat_data.InputFieldValues[i].ValidationResult = null;
            lz_chat_loading(true);
            if(lz_chat_data.ValidationRequired)
            {
                lz_chat_data.InputFieldValues[i].Validate(_contFunc);
                return false;
            }
        }
    }
    return true;
}

function lz_validate_input_result(_result,_id)
{
    var failed = false;
    for(var i = 0;i < lz_chat_data.InputFieldValues.length;i++)
    {
        if(lz_chat_data.InputFieldValues[i].Index != _id || lz_chat_data.InputFieldValues[i].Validated)
            continue;
        if(lz_chat_data.InputFieldValues[i].ValidationResult != null)
            continue;

        var cinput = lz_chat_data.InputFieldValues[i];

        cinput.Validated = true;
        cinput.ValidationResult = _result;
        clearTimeout(cinput.ValidationTimeoutObject);
        if(_result === false)
            failed = true;
        else if(_result === -1)
        {
            if(cinput.ValidationContinueOnTimeout)
            {
                cinput.ValidationResult = true;
                eval(cinput.ValidationContinueAt);
                return;
            }
            else
                failed = true;
        }
        else if(_result === true)
        {
            eval(cinput.ValidationContinueAt);
            return;
        }

        if(failed)
        {
            setTimeout("lz_chat_loading(false);",500);
            setTimeout("document.getElementById('lz_form_mandatory_" + cinput.Index.toString() + "').style.display = '';",501);
            setTimeout("document.getElementById('lz_form_mandatory_" + cinput.Index.toString() + "').className = 'lz_input_icon lz_required lz_anim_hs';",700);
            cinput.Validated = false;
            for(var x=0;x< lz_chat_data.InputFieldValues.length;x++)
                lz_chat_data.InputFieldValues[x].Validated = false;
            return;
        }
    }
}

function lz_chat_scroll()
{
    if(!lz_chat_scrolled)
    {
        lz_chat_scrolled = true;
        lz_chat_set_element_width();
        lz_chat_scoll_down();
    }
}

function lz_chat_set_element_width()
{
    var targetWidth = (lz_chat_fixed_mode) ? lz_global_get_window_width(true) : lz_overlay_chat_width;
    for(var i = 0;i<document.getElementById("lz_chat_content_box").childNodes.length;i++)
        if(document.getElementById("lz_chat_content_box").childNodes[i].tagName.toLowerCase() == "div")
            document.getElementById("lz_chat_content_box").childNodes[i].style.width = (lz_chat_scrolled || document.getElementById("lz_chat_content_box").scrollHeight > document.getElementById("lz_chat_content_box").clientHeight) ? (targetWidth-18+"px") : (targetWidth-3+"px");
}

function lz_chat_set_translation(_activeId,_from,_into)
{
    if(lz_overlay_chat != null)
    {
        if(_into != null)
        {
            _into = lz_global_base64_decode(_into).toLowerCase();
            _into = (_into.length==0) ? null : _into;
        }
        if(_from != null)
        {
            _from = lz_global_base64_decode(_from).toLowerCase();
            _from = (_from.length==0) ? null : _from;
        }

        if(_activeId != null && lz_session.TransSID != _activeId)
        {
            if(_activeId != null)
                lz_session.TransSID = _activeId;

            if(_into != null)
                lz_session.TransInto = _into;
            else
                lz_session.TransInto = "";

            if(_from != null)
                lz_session.TransFrom = _from;
            else
                lz_session.TransFrom = "";

            document.getElementById('lz_chat_overlay_options_trans').checked = (_into != null);
        }

        document.getElementById('lz_chat_overlay_options_trans').checked = lz_session.TransFrom!="";
        for(var i=0;i<document.getElementById('lz_chat_overlay_options_language').options.length;i++)
            if(document.getElementById('lz_chat_overlay_options_language').options[i].value==lz_session.TransFrom)
                document.getElementById('lz_chat_overlay_options_language').selectedIndex = i;

        lz_chat_change_translation();
    }
}

function lz_chat_change_translation()
{
    document.getElementById('lz_chat_overlay_options_language').disabled = !document.getElementById('lz_chat_overlay_options_trans').checked;
    var from = (document.getElementById('lz_chat_overlay_options_trans').checked) ? document.getElementById('lz_chat_overlay_options_language').options[document.getElementById('lz_chat_overlay_options_language').selectedIndex].value : "";
    lz_session.TransFrom = (document.getElementById('lz_chat_overlay_options_trans').checked) ? from : "";
    lz_session.Save();
}

function lz_chat_set_groups(_chatPossible, _groups, _errors, _selected)
{
    try
    {
        lz_chat_data.ForceGroupSelect = lz_force_group_select;
        if(lz_chat_data.Groups == null)
            lz_chat_data.Groups = new lz_group_list(document,document.getElementById('lz_form_groups'));
        lz_chat_data.Groups.StatusIcon = false;
        lz_chat_data.Groups.CreateHeader(lz_text_please_select);
        lz_chat_data.Groups.Update(_groups);
        var selGroup = lz_global_base64_url_decode(_selected);

        if(selGroup.length>0 && !(lz_chat_data.ForceGroupSelect && !lz_chat_data.ForceSelectMade))
        {
            lz_chat_data.SelectedGroup = lz_chat_data.Groups.GetGroupById(selGroup);
            lz_chat_data.Groups.SelectGroupById(lz_chat_data.SelectedGroup.Id,document.getElementById("lz_form_groups"));
        }

        lz_chat_change_group(document.getElementById("lz_form_groups"));
    }
    catch(ex)
    {

    }
}

function lz_chat_data_box()
{
    this.CallMeBackMode = false;
    this.InputFieldIndices = null;
    this.InputFieldValues = null;
    this.CurrentApplication = "chat";
    this.SelectedGroup = null;
    this.Groups = null;
    this.ForceSelectInit = false;
    this.ForceSelectMade = false;
    this.ForceGroupSelect = false;
    this.QueueMessageAppended = false;
    this.TimerWaiting = null;
}

function lz_chat_show_info_box(_id,_active)
{
    var box = document.getElementById('lz_form_info_' + _id);
    box.style.display = (_active && box.style.display != 'block') ? 'block' : 'none';
    box.style.left = "10px";
}

function lz_chat_set_input_fields()
{
    try
    {
        if(lz_chat_data.InputFieldIndices != null && lz_chat_data.SelectedGroup != null)
        {
            var showFileInputLink = false;
            var isComChat = false;
            var isHidden = false;
            var isChat = (lz_chat_data.CurrentApplication!="ticket" && !lz_mode_create_ticket && lz_chat_data.SelectedGroup.Amount > 0);
            var ihidden = (isChat) ? lz_chat_data.SelectedGroup.ChatInputsHidden : lz_chat_data.SelectedGroup.TicketInputsHidden;
            var isRequired = (isChat) ? lz_chat_data.SelectedGroup.ChatInputsMandatory : lz_chat_data.SelectedGroup.TicketInputsMandatory;
            var mandatoryFields = (lz_chat_data.CurrentApplication!="ticket");
            var isPlaceholderSupport = lz_is_placeholder_support();

            for(var i = 0;i < lz_chat_data.InputFieldIndices.length;i++)
            {
                var findex = lz_chat_data.InputFieldIndices[i];
                if(document.getElementById("lz_form_active_" + findex).value == "true")
                {
                    isHidden = ( (lz_array_indexOf(ihidden,findex) > -1) || (lz_chat_data.ForceGroupSelect && !lz_chat_data.ForceSelectMade && lz_chat_data.InputFieldValues[i].IsHiddenGeneral(lz_chat_data.Groups.Groups,isChat)));
                    if(lz_chat_data.CurrentApplication=="chat" && lz_mode_change_details && findex == 114)
                        isHidden = true;

                    if(lz_chat_data.InputFieldValues[i].Type == "File")
                    {
                        isHidden = true;
                        showFileInputLink = ((lz_chat_data.CurrentApplication!="chat"||!isChat)&&!lz_mode_change_details);
                    }
                    document.getElementById("lz_form_" + findex).className = (findex==116 && lz_chat_data.CallMeBackMode) ? "lz_input lz_input_com" : document.getElementById("lz_form_" + findex).className;
                    document.getElementById("lz_form_" + findex).style.display = (isHidden) ? "none" : "";
                    document.getElementById("lz_form_" + findex).style.display = (findex==115) ? ((isComChat) ? "" : "none") : document.getElementById("lz_form_" + findex).style.display;
                    document.getElementById("lz_form_" + findex).style.display = (findex==116 && lz_chat_data.CallMeBackMode) ? "" : document.getElementById("lz_form_" + findex).style.display;

                    if(document.getElementById("lz_form_info_" + findex).innerHTML.length > 0 && !lz_mode_change_details)
                    {
                        if(document.getElementById("lz_form_mandatory_" + findex).className.indexOf("lz_required") == -1)
                            document.getElementById("lz_form_mandatory_" + findex).className = "lz_input_icon lz_info";

                        document.getElementById("lz_form_mandatory_" + findex).style.cursor = "pointer";
                        document.getElementById("lz_form_mandatory_" + findex).style.display = "";
                        document.getElementById("lz_form_mandatory_" + findex).onmouseover = new Function("lz_chat_show_info_box('"+findex.toString()+"',true);");
                        document.getElementById("lz_form_mandatory_" + findex).onmouseout = new Function("lz_chat_show_info_box('"+findex.toString()+"',false);");
                        document.getElementById("lz_form_mandatory_" + findex).onclick = new Function("lz_chat_show_info_box('"+findex.toString()+"',true);");
                        document.getElementById("lz_form_info_" + findex).onclick = new Function("lz_chat_show_info_box('"+findex.toString()+"',false);");
                    }
                    else if(lz_mode_change_details)
                        document.getElementById("lz_form_mandatory_" + findex).style.display = "none";

                    document.getElementsByName("form_" + findex)[0].disabled = lz_mode_change_details && lz_chat_data.InputFieldValues[i].Validation;
                }
                else
                    document.getElementById("lz_form_" + findex).style.display = 'none';

                if(lz_chat_data.InputFieldValues[i].Active)
                {
                    if(lz_array_indexOf(isRequired,findex) != -1 || (lz_chat_data.InputFieldValues[i].Validation && lz_array_indexOf(ihidden,findex) == -1))
                    {
                        if(!lz_mode_chat_login)
                            lz_mode_chat_login = lz_chat_human_available && !lz_chat_botmode;
                        mandatoryFields = true;
                    }

                    if(!isPlaceholderSupport && (lz_chat_data.InputFieldValues[i].Type == "Text" || lz_chat_data.InputFieldValues[i].Type == "TextArea"))
                    {
                        if(document.getElementsByName("form_" + findex)[0].value=='')
                        {
                            document.getElementsByName("form_" + findex)[0].value = document.getElementById("lz_form_ph_" + findex).value;
                            document.getElementsByName("form_" + findex)[0].style.color = '#BBB';
                        }
                        document.getElementsByName("form_" + findex)[0].onfocus=new Function("if (this.value == '"+document.getElementById("lz_form_ph_" + findex).value+"') {this.value = ''; this.style.color='#333'}");
                        document.getElementsByName("form_" + findex)[0].onblur=new Function("if (this.value == '') {this.value = '"+document.getElementById("lz_form_ph_" + findex).value+"'; this.style.color='#BBB'}");
                    }
                }
            }

            var hideGroup = ( (lz_chat_data.CurrentApplication=="chat" && (lz_mode_change_details || lz_hide_group_chat)) || (lz_chat_data.CurrentApplication=="ticket" && lz_hide_group_ticket));
            document.getElementById("lz_group_selection_box").style.display = hideGroup ? "none" : "";
            document.getElementById("lz_chat_file_po").style.display = showFileInputLink ? "" : "none";
        }

        if(!lz_mode_chat_login && lz_force_group_select)
            lz_mode_chat_login = true;
    }
    catch(ex)
    {

    }
}

function lz_chat_load_input_values()
{
    for(var i = 0;i< lz_chat_data.InputFieldIndices.length;i++)
    {
        var findex = lz_chat_data.InputFieldIndices[i];
        if(document.getElementById("lz_form_" + findex) != null)
        {
            if(lz_chat_data.InputFieldValues[i].Type == "File")
                continue;
            if(document.getElementsByName("form_" + findex)[0].tagName.toUpperCase() == "SELECT")
                document.getElementsByName("form_" + findex)[0].selectedIndex = parseInt(lz_chat_data.InputFieldValues[i].Value);
            else if(document.getElementsByName("form_" + findex)[0].type.toUpperCase() == "CHECKBOX")
            {
                if(document.getElementsByName("form_" + findex)[0].value=="")
                    document.getElementsByName("form_" + findex)[0].value = lz_chat_data.InputFieldValues[i].Value;
                document.getElementsByName("form_" + findex)[0].checked = (parseInt(lz_chat_data.InputFieldValues[i].Value)==1);
            }
            else
            {
                if(document.getElementsByName("form_" + findex)[0].value=="")
                    document.getElementsByName("form_" + findex)[0].value = lz_global_trim(lz_chat_data.InputFieldValues[i].Value);
            }
        }
    }
}

function lz_chat_pre_change_group(_box)
{
    lz_chat_data.ForceSelectInit=true;
}

function lz_chat_change_group(_box)
{
    if(lz_chat_data.ForceGroupSelect && !lz_chat_data.ForceSelectMade && _box.selectedIndex == _box.childNodes.length-1)
        return;

    if(lz_chat_data.ForceGroupSelect && lz_chat_data.ForceSelectInit && !lz_chat_data.ForceSelectMade)
    {
        lz_chat_data.ForceSelectMade = true;
        _box.removeChild(lz_chat_data.Groups.ForceSelectOption);
        lz_chat_set_input_fields();
    }
    var last = (lz_chat_data.SelectedGroup != null) ? lz_chat_data.SelectedGroup.Id+lz_chat_data.SelectedGroup.Amount : "";
    lz_chat_data.SelectedGroup = lz_chat_data.Groups.GetGroupById(_box.value);

    if(lz_chat_data.CurrentApplication == "chat" && lz_chat_data.SelectedGroup != null && lz_chat_data.SelectedGroup.Amount == 0 && !lz_chat_state_expanded)
        lz_chat_data.SelectedGroup = null;

    if(lz_chat_data.SelectedGroup == null)
    {
        var position = _box.selectedIndex;
        var reset = false;
        while(lz_chat_data.SelectedGroup == null)
        {
            position++;
            if(position == _box.childNodes.length)
                if(!reset)
                {
                    position = 0;
                    reset=true;
                }
                else
                    break;
            lz_chat_data.SelectedGroup = lz_chat_data.Groups.GetGroupById(_box.childNodes[position].value);
        }
    }
    var current = (lz_chat_data.SelectedGroup != null) ? lz_chat_data.SelectedGroup.Id+lz_chat_data.SelectedGroup.Amount : "";
    if(lz_chat_data.SelectedGroup != null)
    {
        if(_box.length > position)
            _box.selectedIndex = position;

        if(last != current)
        {
            if(lz_mode_chat_login && lz_chat_data.SelectedGroup.Amount == 0 && lz_chat_data.CurrentApplication == "chat")
                lz_chat_data.CurrentApplication = "ticket";
            else if(!lz_chat_delined && lz_chat_data.SelectedGroup.Amount > 0 && lz_chat_data.CurrentApplication == "ticket")
                lz_chat_data.CurrentApplication = "chat";

            lz_chat_prepare_data_form();
            lz_chat_set_focus(9);
        }
        _box.style.color = _box.childNodes[_box.selectedIndex].style.color;
        _box.style.background = _box.childNodes[_box.selectedIndex].style.background;
    }
}

function lz_chat_show_queue_position(_position,_time,_html)
{
    if(!lz_chat_data.QueueMessageAppended)
    {
        var qmessage = lz_global_base64_decode(_html).replace("<!--queue_position-->","<span id='lz_chat_queue_position' style='color:"+lz_color_darker+"'>-1</span>");
        qmessage = qmessage.replace("<!--queue_waiting_time-->","<span id='lz_chat_queue_waiting_time' style='color:"+lz_color_darker+"'>-1</span>");

        lz_chat_add_html_element(lz_global_base64_encode(qmessage),false,null,null,null,null);
        lz_chat_data.QueueMessageAppended = true;
    }

    if(document.getElementById('lz_chat_queue_position'))
    {
        var cposition = parseInt(document.getElementById('lz_chat_queue_position').innerHTML);
        var cwtime = parseInt(document.getElementById('lz_chat_queue_waiting_time').innerHTML);

        if(cposition == -1 || (_position > 0 && _position <= cposition))
            document.getElementById('lz_chat_queue_position').innerHTML = _position;

        if(cwtime == -1 || (_time > 0 && _time <= cwtime))
            document.getElementById('lz_chat_queue_waiting_time').innerHTML = _time;
    }
}

function lz_chat_show_feedback()
{
    lz_chat_init_feedback = true;
    lz_tracking_poll_server(1611);
}

function lz_chat_init_search_kb()
{
    var phrase = lz_chat_get_input_value(114);
    if(lz_session.KBS != 1 || phrase.length < 12)
        return;

    if(phrase != lz_chat_kb_last_search_phrase)
    {
        lz_shared_kb_last_search_time = lz_global_timestamp();
        lz_chat_kb_last_search_phrase =
            lz_chat_kb_search_phrase = phrase;
        lz_tracking_poll_server(1241);
    }
}

function lz_chat_search_result(_external,_count)
{
    lz_chat_kb_search_phrase = "";
    document.getElementById('lz_chat_kb_match_info').style.display = (_count > 0) ? "block" : "none";
    if(_count>0 && !lz_chat_kb_sound_played)
    {
        lz_chat_play_sound('message');
        lz_chat_kb_sound_played = true;
    }
}

function lz_chat_kb_deactivate(_persistent)
{
    lz_chat_search_result(0);
    lz_shared_kb_auto_search = false;

    if(_persistent)
    {
        lz_session.KBS = 0;
        lz_session.Save();
    }
}

function lz_chat_set_zoom(_click)
{
    if(!lz_fixed_mode_possible())
        return;

    if(lz_chat_state_expanded)
    {
        lz_chat_restore_meta();
        lz_overlay_chat.lz_livebox_fixed_mode =
        lz_chat_fixed_mode = true;
        lz_overlay_chat.lz_livebox_div.style.position = "fixed";
        lz_overlay_chat.lz_livebox_hide();
        document.body.style.position = "fixed";
        document.body.style.overflowY = "hidden";
        lz_chat_set_meta();
        setTimeout("lz_livebox_scale_box('lz_overlay_chat',1,true);",100);
        setTimeout("lz_chat_set_slide("+_click+");lz_livebox_center_box('lz_overlay_chat',true);lz_chat_update_css();lz_chat_set_element_width();",400);
    }
    else
    {
        lz_livebox_hide_box('lz_overlay_chat');
        lz_livebox_hide_box('lz_eye_catcher');
        lz_chat_restore_meta();
        document.body.style.position = "";
        document.body.style.overflowY = "";
        lz_overlay_chat.lz_livebox_prevent_scale = false;
        lz_overlay_chat.lz_livebox_fixed_mode =
        lz_chat_fixed_mode = false;
        lz_chat_set_slide(false);
        setTimeout("lz_zoom_factor=null;lz_livebox_init_center_boxes();lz_livebox_show_box('lz_overlay_chat');lz_livebox_show_box('lz_eye_catcher');",500);
    }
}

function lz_chat_set_slide(_in)
{
    if(_in)
    {
        lz_overlay_chat.lz_livebox_div.style["-webkit-transform"] = "translateY(+100%)";
        lz_overlay_chat.lz_livebox_show();
        lz_overlay_chat.lz_livebox_div.className = 'lz_anim_slide_in';
    }
    else
    {
        lz_overlay_chat.lz_livebox_div.style["-webkit-transform"] = "";
        lz_overlay_chat.lz_livebox_div.className = "";
    }
}

function lz_chat_set_meta()
{
    var etags = document.getElementsByTagName("meta");
    if(etags.length > 0)
        for (key in etags)
            if(etags[key].name == "viewport" && etags[key].id!="lzvpc")
            {
                lz_default_meta = etags[key];
                etags[key].parentNode.removeChild(etags[key]);
            }
    var meta = document.createElement('meta');
    meta.name = "viewport";
    meta.id="lzvpc";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.getElementsByTagName('head')[0].appendChild(meta);
}

function lz_chat_restore_meta()
{
    if(document.getElementById("lzvpc")!=null)
    {
        document.getElementById("lzvpc").setAttribute("content","");
        document.getElementsByTagName('head')[0].removeChild(document.getElementById("lzvpc"));
    }
    if(lz_default_meta != null)
        document.getElementsByTagName('head')[0].appendChild(lz_default_meta);
}