var lz_referrer = document.referrer;
var lz_stopped = false;
var lz_request_window = null;
var lz_alert_window = null;
var lz_request_active = null;
var lz_request_last = null;
var lz_overlay_box = null;
var lz_overlay_chat = null;
var lz_overlay_chat_height = 0;
var lz_overlay_chat_height_extended = 0;
var lz_overlay_chat_width = 0;
var lz_eye_catcher = null;
var lz_floating_button = null;
var lz_floating_button_selector = null;
var lz_overlay_active = null;
var lz_overlay_last = null;
var lz_alert_active = null;
var lz_website_push_active = null;
var lz_chat_state_expanded = false;
var lz_event_fire_id = null;
var lz_session;
var lz_poll_id = 0;
var lz_timer = null;
var lz_timezone_offset = (new Date().getTimezoneOffset() / 60) * -1;
var lz_chat_windows = new Array();
var lz_check_cw = null;
var lz_cb_url = new Array();
var lz_document_head = document.getElementsByTagName("head")[0];
var lz_poll_required = false;
var lz_timer_connection_error = null;
var lz_last_image_reload = lz_global_timestamp();
var lz_deactivate = null;
var lz_force_monitoring = false;
var lz_init_floating_selector = null;
var lz_chat_fixed_mode = false;

lz_tracking_start_system();

function lz_tracking_start_system()
{
    if(!lz_resources[0] || !lz_resources[1] || !lz_resources[2] || (lz_overlay_chat_available && (!lz_resources[4])))
    {
        setTimeout(lz_tracking_start_system, 50);
        return;
    }

    lz_geo_resolution = new lz_geo_resolver();
    window.onerror=lz_global_handle_exception;

    lz_session = new lz_jssess();
    lz_session.Load();


    if(location.search.indexOf("lzcobrowse") != -1)
    {
        lz_session.Save();
        lz_tracking_poll_server();
        return;
    }

    try
    {
        if(window.opener != null && typeof(window.opener.lz_get_session) != 'undefined')
        {
            lz_session.UserId = window.opener.lz_get_session().UserId;
            lz_session.GeoResolved = window.opener.lz_get_session().GeoResolved;
        }
    }
    catch(ex)
    {
        // ACCESS DENIED
    }

    lz_session.Save();
    if(!lz_tracking_geo_resolute())
        lz_tracking_poll_server();

    if(lz_is_mobile)
    {
        window.addEventListener("resize",lz_livebox_init_center_boxes_hide);
        window.addEventListener("scroll",lz_livebox_init_center_boxes_hide);
        window.setInterval("lz_livebox_init_center_boxes(false)",1000);
    }

}

function lz_tracking_unload()
{
    if(lz_floating_button != null)
        lz_floating_button.lz_livebox_unload();
    if(lz_request_window != null)
        lz_request_window.lz_livebox_unload();
    if(lz_overlay_box != null)
        lz_overlay_box.lz_livebox_unload();
    if(lz_overlay_chat != null)
        lz_overlay_chat.lz_livebox_unload();
}

function lz_tracking_add_chat_window(_browserId,_parent)
{
	try
	{
		var bfound, bdelete, bactive = false;
		for(var browser in lz_chat_windows)
		{
			if(lz_chat_windows[browser].BrowserId == _browserId || _parent)
			{
				if(!_parent)
				{
					lz_chat_windows[browser].LastActive = lz_global_timestamp();
					lz_chat_windows[browser].Deleted = false;
					lz_chat_windows[browser].Closed = false;
				}
				else if(!lz_chat_windows[browser].Deleted && !lz_chat_windows[browser].Closed && (lz_chat_windows[browser].LastActive <= (lz_global_timestamp()-10)))
				{
					lz_chat_windows[browser].Closed = true;
					bdelete = true;
				}
				bfound = true;
			}
			
			if(!lz_chat_windows[browser].Closed)
				bactive = true;
		}
		if(!bfound && !_parent)
		{
			var chatWindow = new lz_chat_window();
			chatWindow.BrowserId = _browserId;
			chatWindow.LastActive = lz_global_timestamp();
			lz_chat_windows.push(chatWindow);
			bactive = true;
		}
		else if(_parent && bdelete)
		{
			lz_tracking_poll_server(1004);
		}
	
		if(bactive && lz_check_cw == null)
			lz_check_cw = setTimeout("lz_check_cw=null;lz_tracking_add_chat_window('"+_browserId+"',true);",2000);
	}
	catch(ex)
	{

	}
}

function lz_is_geo_resolution_needed()
{
	return (lz_geo_resolution_needed && lz_session.GeoResolved.length != 7 && lz_session.GeoResolutions < 5);
}

function lz_tracking_remove_chat_window(_browserId)
{
	try
	{
		for(var browser in lz_chat_windows)
		{
			if(lz_chat_windows[browser].BrowserId == _browserId)
			{
				lz_chat_windows[browser].Deleted =
				lz_chat_windows[browser].Closed = true;
			}
		}
	}
	catch(ex)
	{
	  // domain restriction
	}
}

function lz_get_session()
{
	return lz_session;
}

function lz_tracking_server_request(_get,_scriptId)
{	
	if(lz_stopped)
		return;

	var lastScript = document.getElementById(_scriptId);
	if(lastScript == null)
	{
		for(var index in lz_chat_windows)
			if(!lz_chat_windows[index].Deleted && lz_chat_windows[index].Closed)
			{
				lz_chat_windows[index].Deleted = true;
				_get += "&clch=" + lz_global_base64_encode(lz_chat_windows[index].BrowserId);
			}

		_get = "?rqst=track" + _get;
		var newScript = document.createElement("script");
		newScript.id = _scriptId;
		newScript.src = lz_poll_url + _get;
		newScript.async = true;
		lz_document_head.appendChild(newScript);
	}
	else
    {
		lz_poll_required = true;
    }
}

function lz_tracking_poll_server(_cll)
{
	var getValues = "&b="+lz_global_base64_url_encode(lz_session.BrowserId)+"&pc="+lz_global_base64_url_encode(++lz_poll_id);
	getValues += (lz_session.UserId != null) ? "&i="+ lz_global_base64_url_encode(lz_session.UserId) : "";

    if(lz_user_language.length>0)getValues += "&el="+lz_user_language;
    if(lz_area_code.length>0)getValues += "&code="+lz_area_code;
    if(lz_referrer.length>0)getValues += "&rf="+lz_global_base64_url_encode(lz_referrer);



    getValues += lz_tracking_get_user_upload_value("en",111,lz_user_name);
    getValues += lz_tracking_get_user_upload_value("ee",112,lz_user_email);
    getValues += lz_tracking_get_user_upload_value("ec",113,lz_user_company);
    getValues += lz_tracking_get_user_upload_value("eq",114,lz_user_question);
    getValues += lz_tracking_get_user_upload_value("ep",116,lz_user_phone);

    if(lz_poll_id<=3)
    {
        var title = document.title;
        if(title.length > 60)
            title = title.substring(0,60)+"...";
        getValues += "&dc="+lz_global_base64_url_encode(title);
        getValues += "&cd="+lz_global_base64_url_encode(window.screen.colorDepth)+"&rh="+lz_global_base64_url_encode(screen.height)+"&rw="+lz_global_base64_url_encode(screen.width)+"&tzo="+lz_global_base64_url_encode(lz_timezone_offset);
        if(lz_geo_resolution_needed && lz_session.GeoResolved.length == 7)
		    getValues += "&geo_lat=" + lz_session.GeoResolved[0] + "&geo_long=" + lz_session.GeoResolved[1] + "&geo_region=" + lz_session.GeoResolved[2] + "&geo_city=" + lz_session.GeoResolved[3] + "&geo_tz=" + lz_session.GeoResolved[4] + "&geo_ctryiso=" + lz_session.GeoResolved[5] + "&geo_isp=" + lz_session.GeoResolved[6];
        getValues += "&geo_rid=" + lz_geo_resolution.Status;
        getValues += "&ue="+lz_global_base64_url_encode(lz_global_base64_url_encode(window.location.href));
	    if(lz_geo_resolution.Span > 0)getValues += "&geo_ss=" + lz_geo_resolution.Span;
    }

	if(lz_request_active != null)getValues += "&actreq=1";
	if(lz_getp_track.length > 0)getValues += "&" + lz_getp_track;
	if(lz_overlay_chat_available)getValues += lz_chat_poll_parameters();
    if(lz_deactivate != null)getValues += "&deactr=" + lz_global_base64_url_encode(lz_deactivate);
    if(lz_init_floating_selector != null)
    {
        lz_stopped = false;
        getValues += "&ifs=1";
        if(lz_init_floating_selector[0]) getValues += "&ifs_oc=MQ_";
        if(lz_init_floating_selector[1]) getValues += "&ifs_opi=MQ_";
        if(lz_init_floating_selector[1]) getValues += "&ifs_pin=" + lz_init_floating_selector[2];
        if(lz_init_floating_selector[1]) getValues += "&ifs_pii=" + lz_init_floating_selector[3];
        if(lz_init_floating_selector[4]) getValues += "&ifs_opo=MQ_";
        if(lz_init_floating_selector[5]) getValues += "&ifs_ot=MQ_";
        if(lz_init_floating_selector[6]) getValues += "&ifs_okb=MQ_";
        getValues += "&ifs_osf=" + lz_init_floating_selector[7];
        getValues += "&ifs_ost=" + lz_init_floating_selector[8];
        getValues += "&ifs_osg=" + lz_init_floating_selector[9];
        if(lz_init_floating_selector[10]) getValues += "&ifs_cl1=" + lz_init_floating_selector[10];
        if(lz_init_floating_selector[11]) getValues += "&ifs_cl2=" + lz_init_floating_selector[11];
        if(lz_init_floating_selector[12]) getValues += "&ifs_cl3=" + lz_init_floating_selector[12];
        getValues += "&ifs_cht=" + lz_init_floating_selector[13];
        getValues += "&ifs_add=" + lz_global_base64_url_encode(lz_init_floating_selector[14]);
    }

    if(lz_event_fire_id != null)
    {
        getValues += "&fe=" + lz_global_base64_url_encode(lz_event_fire_id);
        lz_event_fire_id = null;
        lz_stopped = false;
    }

	if(!lz_stopped)
	{
        lz_tracking_server_request(getValues,"livezilla_pollscript");
		clearTimeout(lz_timer);
		lz_timer = setTimeout("lz_tracking_poll_server();",(lz_poll_frequency*1000));
	}
}

function lz_tracking_get_user_upload_value(_p,_index,_fb)
{
    if(lz_chat_get_input_value(_index) == "" && _fb != "")
        return "&" + _p + "=" + _fb;
    return "";
}

function lz_tracking_callback(_freq)
{
	if(lz_poll_frequency != _freq)
	{
		lz_poll_frequency = _freq;
		clearTimeout(lz_timer);
		lz_timer = setTimeout("lz_tracking_poll_server();",(lz_poll_frequency*1000));
	}
	
	if(lz_timer_connection_error != null)
		clearTimeout(lz_timer_connection_error);

    if(!lz_stopped)
	    lz_timer_connection_error = setTimeout("lz_tracking_callback("+_freq+");",30 * 1000);

    lz_tracking_remove_script("livezilla_pollscript");

    if(lz_last_image_reload < (lz_global_timestamp()-lz_poll_frequency))
    {
        lz_last_image_reload = lz_global_timestamp();
        var links = document.getElementsByTagName("a");
        var lcount = 0;
        for(var i=0;i<links.length;i++)
            if(links[i].className=="lz_cbl" || links[i].className=="lz_fl")
            {
                if(lz_cb_url.length<=lcount)
                    lz_cb_url[lcount] = links[i].childNodes[0].src;
                links[i].childNodes[0].src = lz_cb_url[lcount] + "&cb=" + new Date().getTime();
                lcount++;
            }
    }
	if(lz_poll_required)
	{
		lz_poll_required = false;
		lz_tracking_poll_server(1123);
	}
}

function lz_tracking_remove_script(_id)
{
    var lastScript = document.getElementById(_id);
    if(lastScript != null)
        lz_document_head.removeChild(lastScript);
}

function lz_tracking_set_sessid(_userId, _browId)
{
	lz_session.UserId = lz_global_base64_decode(_userId);
	lz_session.BrowserId = lz_global_base64_decode(_browId);
	lz_session.Save();
}

function lz_tracking_close_request(_id)
{
	if(lz_request_active != null)
	{
		lz_request_last = lz_request_active;
		lz_request_active = null;
	}

	if(lz_request_window != null)
	{
		lz_request_window.lz_livebox_close('lz_request_window');
		lz_request_window = null;
	}
	
	if(lz_overlay_chat != null)
	{
		if(typeof lz_chat_decline_request != "undefined")
			lz_chat_decline_request(_id,true,false);
	}
}

function lz_tracking_init_website_push(_text,_id)
{	
	if(lz_website_push_active == null)
	{
		lz_website_push_active = _id;
		var exec = confirm((lz_global_base64_decode(_text)));
		setTimeout("lz_tracking_action_result('website_push',"+exec+",true);",100);
	}
}

function lz_tracking_exec_website_push(_url)
{
	window.location.href = lz_global_base64_decode(_url);
}

function lz_tracking_stop_tracking()
{
	lz_stopped = true;
	lz_tracking_remove_overlay_chat();
    lz_tracking_remove_script("livezilla_pollscript");
}

function lz_tracking_geo_result(_lat,_long,_region,_city,_tz,_ctryi2,_isp)
{	
	lz_session.GeoResolved = Array(_lat,_long,_region,_city,_tz,_ctryi2,_isp);
	lz_session.Save();
	lz_tracking_poll_server(1001);
}

function lz_tracking_set_geo_span(_timespan)
{
	lz_geo_resolution.SetSpan(_timespan);
}

function lz_tracking_geo_resolute()
{
	if(lz_is_geo_resolution_needed())
	{
		lz_session.GeoResolutions++;
		lz_session.Save();
		lz_geo_resolution.SetStatus(1);
		if(lz_session.GeoResolutions < 4)
		{
			lz_geo_resolution.OnEndEvent = "lz_tracking_geo_result";
			lz_geo_resolution.OnSpanEvent = "lz_tracking_set_geo_span";
			lz_geo_resolution.OnTimeoutEvent = lz_tracking_geo_resolute;
			lz_geo_resolution.ResolveAsync();
		}
		else
			lz_tracking_geo_failure();
		return true;
	}
	else
	{
		lz_geo_resolution.SetStatus(7);
		return false;
	}
}

function lz_tracking_action_result(_action,_result,_closeOnClick,_parameters)
{
	if(_parameters == null)
		_parameters = "";

	_parameters = "&b="+lz_global_base64_url_encode(lz_session.BrowserId)+"&ue="+lz_global_base64_url_encode(lz_global_base64_url_encode(window.location.href)) + _parameters;
	_parameters += (lz_session.UserId != null) ? "&i=" + lz_global_base64_url_encode(lz_session.UserId) : "";

	if(_action=="alert")
		_parameters += "&confalert="+lz_alert_active;
	else if(_action=="overlay_box")
    {
		_parameters += "&confol="+lz_overlay_active;
        lz_overlay_last =
        lz_overlay_box = null;
    }
	else if(_action=="chat_request")
		_parameters += ((!_result) ? "&decreq="+lz_request_active : "&accreq="+lz_request_active);
	else if(_action=="website_push")
	{
		if(_result)
			_parameters += "&accwp="+lz_website_push_active;
		else
			_parameters += "&decwp="+lz_website_push_active;
		setTimeout("lz_website_push_active = null;",10000);
	}
	
	if(_closeOnClick)
	{
		_parameters += "&clreq=1";
		lz_tracking_close_request();
	}
	
	if(lz_overlay_chat_available)
		_parameters += lz_chat_poll_parameters();

    if(!lz_stopped)
	    lz_tracking_server_request(_parameters + "&" + lz_getp_track,Math.random().toString());
}

function lz_tracking_add_floating_button(_pos,_sh,_shblur,_shx,_shy,_shcolor,_ml,_mt,_mr,_mb,_width,_height)
{
	if (lz_floating_button!=null || (document.all && !window.opera && !window.XMLHttpRequest && typeof document.addEventListener != 'function'))
		return;
	var fbdiv = document.getElementById("chat_button_image");
	lz_floating_button = new lz_livebox("lz_floating_button",fbdiv.parentNode.parentNode.innerHTML,_width,_height,_ml,_mt,_mr,_mb,_pos,0,6);
	if(_sh)
		lz_floating_button.lz_livebox_shadow(_shblur,_shx,_shy,_shcolor);
    lz_floating_button.lz_livebox_create();
	lz_floating_button.lz_livebox_show(99996);
}

function lz_tracking_init_floating_button_selector(_params)
{
    if(lz_floating_button_selector == null && _params != null)
    {
        lz_floating_button.lz_livebox_div.className = (lz_floating_button.lz_livebox_div.className+' cwait').replace(/ cdef/g,'');
        lz_init_floating_selector = _params;
        lz_tracking_poll_server(1129);
    }
    else
    {
        lz_floating_button_selector.lz_livebox_close("lz_floating_button_selector");
        lz_init_floating_selector = lz_floating_button_selector = null;
    }
}

function lz_tracking_add_floating_button_selector(_html,_sh,_shblur,_shx,_shy,_shcolor,_height)
{
    if(lz_floating_button != null)
    {
        lz_floating_button.lz_livebox_div.className = (lz_floating_button.lz_livebox_div.className+' cdef').replace(/ cwait/g,'');
        if(lz_floating_button_selector == null)
        {
            var html = lz_global_base64_decode(_html)
            var margins = lz_floating_button.lzibst_margin.slice();
            html = html.replace(/<!--arrow_pos-->/g,lz_floating_button.lzibst_position);
            if(lz_floating_button.lzibst_position == "00")
            {
                margins[0] += (lz_floating_button.lzibst_width+10);
                margins[1] += 30;
            }
            else if(lz_floating_button.lzibst_position == "10")
            {
                margins[0] += (lz_floating_button.lzibst_width+10);
            }
            else if(lz_floating_button.lzibst_position == "20")
            {
                margins[0] += (lz_floating_button.lzibst_width+10);
                margins[3] += 40;
            }
            else if(lz_floating_button.lzibst_position == "21")
            {
                margins[3] += (lz_floating_button.lzibst_height+10);
            }
            else if(lz_floating_button.lzibst_position == "22")
            {
                margins[2] += (lz_floating_button.lzibst_width+14);
                margins[3] += 40;
            }
            else if(lz_floating_button.lzibst_position == "12")
            {
                margins[2] += (lz_floating_button.lzibst_width+14);
            }
            else if(lz_floating_button.lzibst_position == "02")
            {
                margins[2] += (lz_floating_button.lzibst_width+14);
                margins[1] += 30;
            }
            else if(lz_floating_button.lzibst_position == "01")
            {
                margins[1] += (lz_floating_button.lzibst_height+10);
            }

            lz_floating_button_selector = new lz_livebox("lz_floating_button_selector",html,420,_height,margins[0],margins[1],margins[2],margins[3],lz_floating_button.lzibst_position,0,0);
            if(_sh)
                lz_floating_button_selector.lz_livebox_shadow(_shblur,_shx,_shy,_shcolor);
            lz_floating_button_selector.lz_livebox_create();
            lz_floating_button_selector.lz_livebox_show(99997);
            lz_floating_button_selector.lz_livebox_div.style.borderRadius = "5px";
            lz_floating_button_selector.lz_livebox_div.style.overflow = "visible";
            lz_floating_button_selector.lz_livebox_div.style.background = "#FFF";
            lz_floating_button_selector.lz_livebox_div.style.border = "2px solid #e5e5e5";
            lz_floating_button_selector.lz_livebox_div.style.cursor = "default";
            lz_floating_button_selector.lz_livebox_div.style.visibility = "hidden";
            lz_floating_button_selector.lz_livebox_div.className = "lz_fbv2_vis";
        }
    }
}

function lz_tracking_add_overlay_box(_olId,_html,_pos,_speed,_slide,_sh,_shblur,_shx,_shy,_shcolor,_ml,_mt,_mr,_mb,_width,_height,_bg,_bgcolor,_bgop,_br)
{
	if(lz_request_window == null && lz_overlay_box == null && lz_overlays_possible && lz_overlay_last != _olId)
	{
        lz_overlay_last =
		lz_overlay_active = _olId;
		lz_overlay_box = new lz_livebox("lz_overlay_box",lz_global_base64_decode(_html),_width,_height,_ml,_mt,_mr+20,_mb,_pos,_speed,_slide);


        if(_sh)
			lz_overlay_box.lz_livebox_shadow(_shblur,_shx,_shy,'#'+_shcolor);
		if(_bg)
			lz_overlay_box.lz_livebox_background('#'+_bgcolor,_bgop);

        lz_overlay_box.lz_livebox_create();
		lz_overlay_box.lz_livebox_show(99999);
        lz_overlay_box.lz_livebox_div.style.borderRadius = _br + "px";

        if(_sh)
            lz_overlay_box.lz_livebox_div.style.background = "#FFFFFF";

        if(lz_fixed_mode_possible() && (_width> lz_global_get_window_width(true) || _height>lz_global_get_window_height() || lz_chat_fixed_mode))
        {
            lz_overlay_box.lz_livebox_fixed_mode = true;
            lz_overlay_box.lz_livebox_div.style.height = "auto";
            lz_overlay_box.lz_livebox_div.style.width= "auto";
            lz_overlay_box.lz_livebox_div.style.borderRadius = "0";
            lz_overlay_box.lz_livebox_div.style.position = "fixed";
            lz_overlay_box.lz_livebox_div.getElementsByTagName("div")[0].style.borderRadius="0";
            lz_overlay_box.lz_livebox_div.getElementsByTagName("div")[0].style.height="100%";
            lz_overlay_box.lz_livebox_div.getElementsByTagName("div")[0].style.width="100%";
            lz_overlay_box.lz_livebox_div.getElementsByTagName("div")[0].style.overflow="scroll";
        }
		window.focus();
	}
}

function lz_tracking_send_alert(_alertId,_text)
{
	if(lz_alert_active == null && lz_overlays_possible)
	{
		lz_alert_active = _alertId;
        alert(lz_global_base64_decode(_text));
        //lz_tracking_action_result("alert",true,false);
        lz_alert_active=null;
		window.focus();
	}
}

function lz_tracking_remove_buttons()
{
    for (var i = 0;i<document.getElementsByTagName("a").length;i++)
        if(document.getElementsByTagName("a")[i].className=="lz_cbl")
            document.getElementsByTagName("a")[i].parentNode.removeChild(document.getElementsByTagName("a")[i]);
}

function lz_tracking_request_chat(_reqId,_text,_template,_width,_height,_ml,_mt,_mr,_mb,_position,_speed,_slide,_sh,_shblur,_shx,_shy,_shcolor,_bg,_bgcolor,_bgop)
{
	if(lz_overlay_box == null && lz_request_window == null && lz_overlays_possible)
	{
		_template = (lz_global_base64_decode(_template)).replace("<!--invitation_text-->",(lz_global_base64_decode(_text)));
		lz_request_active = _reqId;
		lz_request_window = new lz_livebox("lz_request_window",_template,_width,_height,_ml,_mt,_mr,_mb,_position,_speed,_slide);
	
		if(_sh)
			lz_request_window.lz_livebox_shadow(_shblur,_shx,_shy,'#'+_shcolor);
		if(_bg)
			lz_request_window.lz_livebox_background('#'+_bgcolor,_bgop);

	 	if(lz_request_last != _reqId)
		{
            lz_request_window.lz_livebox_create();
			lz_request_window.lz_livebox_show(99999);
			window.focus();
		}
	}
}

function lz_tracking_add_overlay_chat(_template,_text,_width,_height,_ml,_mt,_mr,_mb,_position,_expanded,_online)
{
	lz_header_text = lz_global_base64_decode(_text);
	if(lz_overlay_chat == null && lz_overlays_possible)
	{
        _height = Math.min(_height,lz_global_get_window_height());
        _width = Math.min(_width,lz_global_get_window_width());
        lz_overlay_chat_height_extended = lz_overlay_chat_height = _height;
        lz_overlay_chat_width =_width;
        lz_session.OVLCPos="";
        lz_session.OVLCState = "0";;

        /*
		if(!_online && typeof lz_tickets_external != 'undefined' && lz_tickets_external)
			lz_session.OVLCState = "0";
        if(_online && typeof lz_chats_external != 'undefined' && lz_chats_external)
            lz_session.OVLCState = "0";
           */

        _mr = (_position=="22") ? _mr+20 : _mr;
        _ml = (_position=="20") ? _ml+20 : _ml;
		_template = (lz_global_base64_decode(_template)).replace("<!--text-->",lz_header_text);
		_height = (lz_session.OVLCState == "1") ? _height : 31;
		lz_overlay_chat = new lz_livebox("lz_overlay_chat",_template,lz_overlay_chat_width,_height,_ml,_mt,_mr,_mb,_position,0,6);
        lz_overlay_chat.lz_livebox_on_move = "lz_chat_update_css();";
        if(!lz_is_mobile)
            lz_overlay_chat.lz_livebox_preset(lz_session.OVLCPos,false/*lz_session.OVLCState == "1"*/);
        lz_overlay_chat.lz_livebox_create();
	}
}

function lz_tracking_add_eye_catcher(_template,_width,_height,_pwidth,_pheight,_ml,_mr,_mb,_position,_sha,_shb,_shx,_shy,_shc,_sgs,_sge,_sglw,_fgs,_fge,_fi,_fo,_p)
{
    try
    {
        if(lz_eye_catcher == null && lz_overlay_chat != null && lz_session.ECH != "1")
        {
            _mb+=lz_overlay_chat.lzibst_margin[3];
            _mr = (_position=="22") ? _mr+20+(_pwidth-_width) : _mr;
            _mr = (_position=="21") ? _mr+((_pwidth-_width)/2) : _mr;
            _ml = (_position=="20") ? (_ml+20) : _ml;
            lz_eye_catcher = new lz_livebox("lz_eye_catcher",lz_global_base64_decode(_template),_width,_height,_ml,0,_mr,_mb,_position,0,6);
            if(!lz_is_mobile)
                lz_eye_catcher.lz_livebox_preset(lz_session.OVLCPos,false);
            lz_eye_catcher.lz_livebox_create();

            if(lz_ec_type==1)
            {
                if(_sha==1)
                {
                    var ctxs = document.getElementById("lz_overlay_eyecatcher_shadow").getContext("2d");
                    lz_tracking_cbubble(ctxs,1,5,(_width-_shx-3),_height-25,10,true,_shb,_shx,_shy,_shc,null,null,null,null,null,false);
                }
                var ctx = document.getElementById("lz_overlay_eyecatcher_bubble").getContext("2d");
                lz_tracking_cbubble(ctx,1,5,(_width-_shx-3),_height-25,10,false,null,null,null,null,_sgs,_sge,_sglw,_fgs,_fge,_p);
            }
            document.getElementById('lz_eye_catcher').style.cursor = "auto";
            if(lz_session.OVLCState != "1")
            {
                if(_fi > 0)
                    setTimeout("lz_fade_in(document.getElementById('lz_overlay_eyecatcher'),55);",_fi*1000);
                else
                    document.getElementById('lz_overlay_eyecatcher').style.display = '';

                if(_fo > 0)
                   setTimeout("lz_tracking_remove_eye_catcher(null,null);",_fo*1000);
            }
            else
            {
                document.getElementById('lz_eye_catcher').style.display = 'none';
            }
        }
    }
    catch(ex)
    {


    }
}

function lz_tracking_cbubble(_ctx,_x,_y,_w,_h,_r,_sha,_shb,_shx,_shy,_shc,_sgs,_sge,_sglw,_fgs,_fge,_p)
{
    try
    {
        _x+=_sglw;
        _w-=_sglw;

        _ctx.beginPath();
        _ctx.moveTo(_x + _r, _y);
        _ctx.lineTo(_x + _w - _r, _y);
        _ctx.quadraticCurveTo(_x + _w, _y, _x + _w, _y + _r);
        _ctx.lineTo(_x + _w, _y + _h - _r);
        _ctx.quadraticCurveTo(_x + _w, _y + _h, _x + _w - _r, _y + _h);

        var m = (_w/2)-48;
        _ctx.lineTo(m+_x+60 + _r, _y + _h);
        _ctx.lineTo(m+_x+35 + _r, _y + _h+15);
        _ctx.lineTo(m+_x+10 + _r, _y + _h);
        _ctx.lineTo(_x + _r, _y + _h);
        _ctx.quadraticCurveTo(_x, _y + _h, _x, _y + _h - _r);
        _ctx.lineTo(_x, _y + _r);
        _ctx.quadraticCurveTo(_x, _y, _x + _r, _y);
        _ctx.closePath();
        _ctx.save();

        if(_sha)
        {
            _ctx.shadowColor = _shc;
            _ctx.shadowBlur = _shb;
            _ctx.shadowOffsetX = _shx;
            _ctx.shadowOffsetY = _shy;
            _ctx.fill();
        }
        else
        {
            var grdfill=_ctx.createLinearGradient(_x,_y,0,_h);
            grdfill.addColorStop(0,_fgs);
            grdfill.addColorStop(1,_fge);
            _ctx.fillStyle = grdfill;
            _ctx.fill();

            if(_p)
            {
                _ctx.fillStyle = _fge;
                _ctx.fillRect(_x+(_sglw/2),_y+2+(_sglw/2),2,_h-(_sglw/2)-5);
                _ctx.fillRect(_x+2+(_sglw/2),_y+(_sglw/2),82-(_sglw/2),_h-(_sglw/2)-1);
            }

            if(_sglw>0)
            {
                var grdstroke=_ctx.createLinearGradient(_x,_y,0,_h);
                grdstroke.addColorStop(0,_sgs);
                grdstroke.addColorStop(1,_sge);
                _ctx.strokeStyle = grdstroke;
                _ctx.lineWidth = _sglw;
            }

            if(_sglw>0)
                _ctx.stroke();
        }
    }
    catch(e)
    {


    }
}

function lz_tracking_remove_eye_catcher(event, element)
{
    if(event != null)
    {
        if (event.stopPropagation)
            event.stopPropagation();
        else
            event.cancelBubble = true;
    }

    if(lz_session != null && document.getElementById("lz_overlay_eyecatcher") != null)
    {
        lz_session.ECH = 1;
        lz_session.Save();
        lz_fade_out(document.getElementById('lz_eye_catcher'),25);
    }
}

function lz_tracking_remove_overlay_chat()
{
	if(lz_overlay_chat != null)
	{
		clearTimeout(lz_chat_invite_timer);
		clearTimeout(lz_chat_waiting_posts_timer);
		lz_overlay_chat.lz_livebox_close();
		lz_overlay_chat = null;
	}
    lz_tracking_remove_eye_catcher(null,null);
}

function lz_tracking_geo_failure()
{
	lz_tracking_set_geo_span(lz_geo_error_span);
	lz_geo_resolution.SetStatus(4);
	lz_session.GeoResolved = Array('LTUyMg==','LTUyMg==','','','','','');
	lz_session.Save();
	lz_tracking_poll_server(1002);
}

function lz_tracking_chat_params(_name,_email,_intid,_groupid,_dl)
{
    return "";
}

function lz_tracking_init_external_window(_name,_intid,_groupid,_parameters,_dl)
{
    if(_parameters.indexOf('&en=') == -1 && _name != '')
        _parameters += "&en=" + _name;
    if(_parameters.indexOf('&intid=') == -1 && _intid != '')
        _parameters += '&intid='+_intid;
    if(_parameters.indexOf('&intgroup=') == -1 && _groupid != '')
        _parameters += '&hg=Pw__&intgroup='+_groupid;
    if(_parameters.indexOf('&dl=') == -1 && _dl)
        _parameters += '&dl=MQ__';
    _parameters += '&' + lz_getp_chat;
    void(window.open(lz_poll_server + lz_poll_file_chat + '?a=MQ__' + _parameters.replace('&&','&'),'LiveZilla','width='+lz_window_width+',height='+lz_window_height+',left=50,top=50,resizable=yes,menubar=no,location=no,status=yes,slidebars=no'));
}

function lz_tracking_deactivate(_confirm,_days)
{
    lz_deactivate = _days;
    lz_tracking_poll_server(1214);
    lz_tracking_send_alert("dtr",_confirm);
}

function lz_tracking_set_widget_visibility(_visible)
{
    if(lz_session.OVLCState != '0' && !_visible)
        return;

    if(lz_eye_catcher != null && lz_overlay_chat != null)
    {
        if(_visible && !lz_eye_catcher.lz_livebox_shown)
            lz_eye_catcher.lz_livebox_show(9999);
        document.getElementById('lz_eye_catcher').style.display = (_visible && lz_session.ECH != 1) ? '' : 'none';
    }

    if(lz_overlay_chat != null)
    {
        if(_visible && !lz_overlay_chat.lz_livebox_shown)
        {
            lz_overlay_chat.lz_livebox_show(9999);

            if(lz_session.OVLCState == "1")
                lz_chat_change_state(false,true);
            lz_chat_set_init();
            lz_chat_update_css();
        }
        document.getElementById('lz_overlay_chat').style.display = (_visible) ? '' : 'none';
    }
}

function lz_tracking_selector_init_callback(_params)
{
    document.getElementById('lz_fbv2_callback_number').className = 'x2';
    var phone = document.getElementById('lz_fbv2_callback_number').value;
    if(phone.length < 5)
        setTimeout("document.getElementById('lz_fbv2_callback_number').className = 'lz_anim_input';",200);
    else
    {
        lz_tracking_init_external_window("","","","&t=Y2FsbGJhY2s_&cmb=MQ__&dl=MQ__"+_params+"&ep="+lz_global_base64_url_encode(phone),true);
        lz_tracking_init_floating_button_selector(null);
    }

}

function lz_tracking_add_tag(_html)
{
    var container = document.createElement("div");
    container.innerHTML = lz_global_base64_decode(_html);
    document.body.appendChild(container);
    var arr = container.getElementsByTagName('script');
    for (var n = 0; n < arr.length; n++)
    {
        if(arr[n].innerHTML!="")
            eval(arr[n].innerHTML);
        if(arr[n].src!=null)
        {
            var newScript = document.createElement("script");
            newScript.src = arr[n].src;
            newScript.async = true;
            lz_document_head.appendChild(newScript);
        }
    }
}

function lz_event_fire(_id)
{
    lz_event_fire_id = _id;
    lz_tracking_poll_server(1006);
}

function lz_fixed_mode_possible()
{
    return lz_is_mobile && !lz_is_ie;
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
}