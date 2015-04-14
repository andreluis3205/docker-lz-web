var lz_default_info_text = "<!--lang_client_press_enter_to_send-->";
var lz_text_connecting_info = "<!--lang_client_trying_to_connect_you-->";
var lz_text_save = "<!--lang_client_save-->";
var lz_text_back = "<!--lang_client_back-->";
var lz_text_send_message = "<!--lang_client_send_message-->";
var lz_text_start_chat = "<!--lang_client_start_chat-->";
var lz_text_chat_header = "<!--lang_client_start_chat_header-->";
var lz_text_ticket_header = "<!--lang_client_ticket_header-->";
var lz_text_please_select = "<!--lang_client_please_select-->";
var lz_text_chat_information = "<!--lang_client_start_chat_information-->";
var lz_text_ticket_information = "<!--lang_client_ticket_information-->";
var lz_text_leave_message = "<!--lang_client_leave_message-->";
var lz_force_group_select = <!--require_group_selection-->;
var lz_hide_group_chat = <!--hide_group_select_chat-->;
var lz_hide_group_ticket = <!--hide_group_select_ticket-->;

var lz_guest_name = "<!--lang_client_guest-->";
var lz_header_online = "<!--header_online-->";
var lz_header_offline = "<!--header_offline-->";
var lz_ec_header = "<!--ec_header_text-->";
var lz_ec_sub_header = "<!--ec_header_sub_text-->";
var lz_ec_o_header = "<!--ec_o_header_text-->";
var lz_ec_o_sub_header = "<!--ec_o_header_sub_text-->";
var lz_ec_type = <!--ec_t-->;
var lz_ec_image = "<!--ec_image-->";
var lz_ec_o_image = "<!--ec_o_image-->";
var lz_mode_change_details = false;
var lz_mode_create_ticket = false;
var lz_mode_chat_login = false;
var lz_mode_ticket_feedback = false;
var lz_mode_show_options = false;

var lz_tickets_external = <!--tickets_external-->;
var lz_chats_external = <!--chats_external-->;
var lz_lang_fill_required_fields = "<!--lang_client_fill_mandatory_fields-->";
var lz_lang_options = "<!--lang_client_options-->";
var lz_post_html = "<!--post_html-->";
var lz_add_html = "<!--add_html-->";
var lz_tr_api_key = "<!--gtv2_api_key-->";
var lz_trans_into = "<!--def_trans_into-->";
var lz_no_ticket_when_online = <!--no_ticket_when_online-->;

try
{
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.lz_chat_mail { color: <!--color--> !important; }';
    style.innerHTML += '.lz_chat_link { color: <!--color--> !important; }';
    style.innerHTML += '.lz_chat_file { color: <!--color--> !important; }';
    style.innerHTML += '.lz_chat_human { color: <!--color--> !important; }';
    style.innerHTML += '.lz_con_inf {color: <!--color--> !important; font-weight:bold;}';
    document.getElementsByTagName('head')[0].appendChild(style);
}
catch(ex)
{

}

function lz_chat_get_parameters(_ws)
{
    return lz_getp_track + ((_ws && lz_poll_website != "") ? "&ws="+lz_poll_website : "");
}

function lz_chat_change_state(_click,_required)
{
	if(!lz_chat_state_expanded && lz_chat_data.CurrentApplication!="chat")
	{
        if(lz_chat_handle_ticket_forward(_click) || lz_chats_external)
            return;
	}
    else if(!lz_chat_state_expanded && lz_chat_data.CurrentApplication=="chat" && lz_chats_external)
    {
        void(window.open(lz_poll_server + 'chat.php?acid=MQ_&' + lz_chat_get_parameters(true),'','width='+lz_window_width+',height='+lz_window_height+',left=100,top=100,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes'))
        return;
    }
	else if(lz_chat_invite_timer != null)
	{
		clearTimeout(lz_chat_invite_timer);
	}

	if(document.getElementById("lz_chat_invite_id") != null && lz_chat_state_expanded && _click && _required)
		lz_chat_decline_request(document.getElementById("lz_chat_invite_id").value,false,false);
	
	if(!_required && lz_chat_state_expanded)
		return false;

    if(lz_chat_state_expanded)
        document.getElementById('lz_chat_text').blur();

    if(lz_eye_catcher != null && lz_session.ECH != "1" && document.getElementById("lz_overlay_chat") != null)
    {
        document.getElementById("lz_eye_catcher").style.left = document.getElementById("lz_overlay_chat").style.left;
        document.getElementById('lz_overlay_eyecatcher').style.display = (!lz_chat_state_expanded) ? 'none' : '';
    }

	lz_chat_state_expanded = !lz_chat_state_expanded;
	lz_session.OVLCState = lz_chat_state_expanded ? "1" : "0";


    if(lz_chat_state_expanded)
    {
        setTimeout("lz_chat_set_focus();",100);
        lz_chat_set_element_width();
        lz_chat_scoll_down();
    }

	if(_click)
		lz_chat_update_waiting_posts(0);

    if(!lz_is_tablet)
        if(!lz_chat_state_expanded)
        {
            lz_overlay_chat.lz_livebox_div.style.top="";
            lz_overlay_chat.lz_livebox_div.style.bottom= lz_overlay_chat.lzibst_margin[3] + "px";
        }
        else
        {
            lz_overlay_chat.lz_livebox_div.style.top=(lz_global_get_window_height()-lz_overlay_chat_height-lz_overlay_chat.lzibst_margin[3]) + "px";
            lz_overlay_chat.lz_livebox_div.style.bottom= "";
        }

	lz_session.Save();
    lz_chat_update_css();

	document.getElementById("lz_chat_state_change").style.display = (lz_chat_state_expanded) ? "" : "none";

	lz_chat_update_waiting_posts(0,false);
	document.getElementById("lz_chat_waiting_messages").style.display = "none";
}

function lz_chat_change_widget_application(_chat)
{
    if(!_chat && (lz_tickets_external || <!--offline_message_mode--> == 1) && lz_chat_state_expanded)
    {
        lz_chat_change_state(false,true);
    }
    else if(_chat && lz_chats_external && lz_chat_state_expanded)
    {
        lz_chat_change_state(false,true);
    }
}

function lz_chat_handle_ticket_forward(_click)
{
    if(_click && <!--offline_message_pop--> && <!--offline_message_mode--> == 1)
    {
        void(window.open('<!--offline_message_http-->','','width='+lz_window_width+',height='+lz_window_height+',left=100,top=100,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes'))
        return true;
    }
    else if(_click && <!--offline_message_mode--> == 1)
    {
        window.location.href = '<!--offline_message_http-->';
        return true;
    }
    if(_click && lz_tickets_external)
    {
        void(window.open(lz_poll_server + 'chat.php?acid=MQ_&' + lz_chat_get_parameters(true),'','width='+lz_window_width+',height='+lz_window_height+',left=100,top=100,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes'))
        return true;
    }
    return false;
}

function lz_chat_update_css()
{
    document.getElementById('lz_chat_content').style.display = (!lz_chat_state_expanded) ? 'none' : '';
    document.getElementById('lz_chat_overlay_main').style.borderRadius = (!lz_chat_state_expanded) ? '6px 6px 0 0' : '6px';
    document.getElementById("lz_chat_overlay_text").style.cursor = (lz_chat_state_expanded) ? "move" : "pointer";
    document.getElementById("lz_chat_overlay_main").style.cursor = (lz_chat_state_expanded) ? "" : "default";
    lz_overlay_chat.lz_livebox_div.style.height = (lz_chat_state_expanded) ? Math.max(lz_overlay_chat_height,lz_overlay_chat_height_extended) + "px" : "31px";
    lz_overlay_chat.lz_livebox_div.style.zIndex = (lz_chat_state_expanded) ? 99999 : 9999;
    lz_overlay_chat.lz_livebox_div.style.borderRadius = "6px";

    if(<!--shadow-->)
        lz_overlay_chat.lz_livebox_div.style.boxShadow = "<!--shadowx-->px <!--shadowy-->px <!--shadowb-->px #<!--shadowc-->";

    if(!lz_chat_state_expanded)
    {
        lz_overlay_chat.lz_livebox_div.style.borderBottomRightRadius = "0px";
        lz_overlay_chat.lz_livebox_div.style.borderBottomLeftRadius = "0px";
    }
}

function lz_chat_set_init()
{
	lz_external.Id = "<!--system_id-->";
	lz_chat_detect_sound();
	document.getElementById('lz_chat_overlay_options_sound').checked = lz_sound_available && lz_session.OVLCSound==1;

    lz_change_name = lz_global_base64_url_decode("<!--user_name-->");
    lz_change_email = lz_global_base64_url_decode("<!--user_email-->");

    if(lz_session.TransFrom != "")
        lz_chat_set_translation(null,lz_global_base64_encode(lz_session.TransFrom),null);
}

