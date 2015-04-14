function lz_chat_release_frame(_name)
{
    lz_chat_data.PermittedFrames--;
    if(lz_chat_data.PermittedFrames==-1)
    {
		lz_chat_close();
    }
	if(lz_chat_data.PermittedFrames == 0 && lz_chat_data.Status.Status == lz_chat_data.STATUS_START)
	{
		lz_chat_set_parentid();
		if(!lz_chat_data.SetupError)
		{
			if(lz_geo_resolution_needed && lz_chat_data.ExternalUser.Session.GeoResolved.length != 7)
				lz_chat_geo_resolute();
			else
			{
				lz_chat_data.GeoResolution.SetStatus(7);
				setTimeout("lz_chat_startup();",200);
			}
		}
		else
		{
			lz_chat_release(false,lz_chat_data.SetupError);
		}
		
	}
	else if(lz_chat_data.PermittedFrames == 0 && lz_chat_data.Status.Status == lz_chat_data.STATUS_INIT)
		lz_chat_loaded();
}

function lz_chat_switch_feedback()
{
    var height = lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0','lz_chat_feedback_frame').style.height.toString().replace("px",'');
    if(!lz_chat_data.InternalUser.Id.length > 0)
    {
        lz_chat_chat_alert(lz_chat_data.Language.WaitForRepresentative,lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0',''),null);
        return;
    }
    lz_chat_switch_dropdown('lz_chat_feedback_frame',height == "0" || !height,65);
}

function lz_chat_switch_file_upload()
{
	var height = lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0','lz_chat_file_frame').style.height.toString().replace("px",'');
	if(height=="0" && lz_chat_data.Status.Status == lz_chat_data.STATUS_STOPPED)
	{
		lz_chat_chat_alert(lz_chat_data.Language.RepresentativeLeft,lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0',''),null);
		return;
	}
		
	if(!lz_chat_data.InternalUser.Available)
	{
		lz_chat_chat_alert(lz_chat_data.Language.WaitForRepresentative,lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0',''),null);
		return;
	}
    lz_chat_switch_dropdown('lz_chat_file_frame',height == "0" || !height,60);
}

function lz_chat_switch_emoticons()
{
    var height = lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0','lz_chat_emoticons_frame').style.height.toString().replace("px",'');
    lz_chat_switch_dropdown('lz_chat_emoticons_frame',height == "0" || !height,40);
}

function lz_chat_switch_auto_translate()
{
    var height = lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0','lz_chat_auto_translate_frame').style.height.toString().replace("px",'');
    lz_chat_switch_dropdown('lz_chat_auto_translate_frame',height == "0" || !height,40);
}

function lz_chat_switch_transcript()
{
    var height = lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0','lz_chat_transcript_frame').style.height.toString().replace("px",'');
    lz_chat_switch_dropdown('lz_chat_transcript_frame',height == "0" || !height,40);
}

function lz_chat_switch_com_chat_box(_visible)
{
    lz_chat_switch_dropdown('lz_chat_com_frame',_visible,40);
}

function lz_chat_switch_dropdown(_name,_show,_expanded,_rec)
{
    if(_name != "")
    {
        var height = lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0',_name).style.height.toString().replace("px",'');
        if(_show)
        {
            lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0',_name).style.visibility = "visible";
            lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0',_name).style.height = _expanded + "px";
        }
        else
        {
            lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0',_name).style.visibility = "hidden";
            lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0',_name).style.height = "0px";
        }
    }
    if(_show)
    {
        if(_name != "lz_chat_file_frame")
            lz_chat_switch_dropdown("lz_chat_file_frame",false,0,true);
        if(_name != "lz_chat_feedback_frame")
            lz_chat_switch_dropdown("lz_chat_feedback_frame",false,0,true);
        if(_name != "lz_chat_emoticons_frame")
            lz_chat_switch_dropdown("lz_chat_emoticons_frame",false,0,true);
        if(_name != "lz_chat_auto_translate_frame")
            lz_chat_switch_dropdown("lz_chat_auto_translate_frame",false,0,true);
        if(_name != "lz_chat_transcript_frame")
            lz_chat_switch_dropdown("lz_chat_transcript_frame",false,0,true);
        if(_name != "lz_chat_com_frame")
            lz_chat_switch_dropdown("lz_chat_com_frame",false,0,true);

        _expanded++;
    }
    else
    {
        if(!_rec && lz_chat_data.ComChatVoucherActive != null)
        {
            lz_chat_switch_com_chat_box(true);
            return;
        }
        else
            _expanded = 0;
    }
    lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0','lz_chat_main').style.top = _expanded + "px";
    lz_chat_scroll_down();
}

function lz_chat_is_dropdown_open()
{
    var mainTop = lz_chat_get_frame_object('lz_chat_frame.3.2.chat.5.0','lz_chat_main').style.top.toString().replace("px",'');
    return (mainTop != "0" && mainTop != "");
}

function lz_chat_resize()
{
    try
    {return;
        var frame_rows = lz_chat_get_frame_object('','lz_chat_frameset_chat').rows.split(",");
        var height = parseInt(frame_rows[1]);
        frame_rows[1] = height;
        lz_chat_get_frame_object('','lz_chat_frameset_chat').rows = frame_rows.join(",");
        lz_chat_scroll_down();
    }
    catch(ex)
    {
    }
}



function lz_chat_get_frame_object(_frame,_id)
{
	try
	{
		if(_id == "")
			return frames['lz_chat_frame.3.2'].frames[_frame];
		else if(_frame == "")
			return frames['lz_chat_frame.3.2'].document.getElementById(_id);
		else
			return frames['lz_chat_frame.3.2'].frames[_frame].document.getElementById(_id);
    }
	catch(ex)
	{
		//alert(ex+_frame);
	}
}

function lz_chat_change_url(_url,_parent)
{
    if(_parent && window.opener != null && !window.opener.closed)
    {
        window.opener.location =_url;
        window.close();
    }
    else
    {
	    lz_chat_remove_from_parent();
	    lz_chat_data.WindowNavigating = true;
	    window.location.href = _url;
    }
}