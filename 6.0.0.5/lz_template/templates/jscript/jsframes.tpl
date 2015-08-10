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

function lz_chat_switch_com_chat_box(_visible)
{
    lz_chat_get_frame_object('lz_chat_com_frame').style.visibility = (_visible) ? 'visible' : 'hidden';
}

function lz_chat_switch_file_upload()
{
    lz_chat_dialog(null,'lz_chat_file_frame',null,lz_chat_data.Language.Close,null,true);
    if(lz_chat_get_frame_object('lz_chat_file_upload_frame').src == "")
        lz_chat_get_frame_object('lz_chat_file_upload_frame').src = "./upload.php?cid="+ lz_global_base64_url_encode(lz_chat_data.Id);
}

function lz_chat_switch_emoticons()
{
    lz_chat_dialog(null,lz_chat_get_frame_object('lz_chat_emoticons_frame'),null,lz_chat_data.Language.Close,null,true);
}

function lz_chat_switch_auto_translate()
{
    lz_chat_dialog(null,lz_chat_get_frame_object('lz_chat_auto_translate_frame'),null,lz_chat_data.Language.Save,null,true);
}

function lz_chat_switch_transcript()
{
    lz_chat_dialog(null,lz_chat_get_frame_object('lz_chat_transcript_frame'),null,lz_chat_data.Language.Save,null,true);
}

function lz_chat_switch_options(_forceClose)
{
    lz_chat_get_frame_object('lz_chat_options_table').style.display = (lz_chat_get_frame_object('lz_chat_options_table').style.display=='none' && !_forceClose) ? '' : 'none';
}

function lz_chat_is_dropdown_open()
{
    var mainTop = lz_chat_get_frame_object('lz_chat_main').style.top.toString().replace("px",'');
    return (mainTop != "0" && mainTop != "");
}

function lz_chat_get_frame_object(_id)
{
    var innerDoc = document.getElementById("lz_chat_content").contentDocument || document.getElementById("lz_chat_content").contentWindow.document;
    if(_id == "")
        return innerDoc;
    else
        return innerDoc.getElementById(_id);
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

function lz_chat_show_header()
{
    var width = lz_global_get_window_width();
    var height = lz_global_get_window_height();
    var hideHeader = width < 250 || lz_chat_data.IsSmall || !lz_chat_data.IsLogo || height < 500 || lz_chat_data.KBOnly;
    var hideLoginHeader = lz_chat_data.IsSmall || height < 600 || width < 400 || lz_chat_data.CheckoutActive || lz_chat_data.KBOnly;

    lz_chat_data.TopMargin = (!hideHeader) ? 130 : 30;

    if(lz_chat_get_frame_object('lz_header') != null)
    {
        lz_chat_get_frame_object('lz_header').style.display = (hideHeader) ? 'none' : '';
        lz_chat_get_frame_object('lz_header').style.height = (!hideHeader) ? "99px" : "0";
        lz_chat_get_frame_object('lz_chat_logo').style.display = (width < 450) ? 'none' : '';

        if(lz_chat_get_frame_object('lz_chat_login') != null)
        {
            lz_chat_get_frame_object('lz_chat_logo').style.display = '';
            lz_chat_get_frame_object('lz_chat_top_bg').style.display = (width < 450) ? 'none' : '';
            lz_chat_get_frame_object('lz_input_header_box').style.display = (hideLoginHeader) ? 'none' : '';
            lz_chat_get_frame_object('lz_chat_knowledgebase').style.top =
            lz_chat_get_frame_object('lz_chat_login').style.top = (hideLoginHeader && hideHeader) ? (lz_chat_data.KBOnly) ? "0" : "38px" : ((hideLoginHeader) ? "137px" : ((!hideLoginHeader && !hideHeader) ? "217px" : "137px"));

            if(lz_chat_data.KBOnly)
            {
                lz_chat_get_frame_object('lz_chat_param').style.display = 'none';
                lz_chat_get_frame_object('lz_chat_knowledgebase').style.bottom = '0px';
            }
        }
        else
        {
            lz_chat_get_frame_object('lz_chat_logo').style.display = (width < 450) ? 'none' : '';
            lz_chat_get_frame_object('lz_chat_members_box').style.top =
            lz_chat_get_frame_object('lz_chat_main').style.top = (lz_chat_data.TopMargin) + "px";
            lz_chat_get_frame_object('lz_chat_com_frame').style.top = (lz_chat_data.TopMargin-31) + "px";
            lz_chat_get_frame_object('lz_chat_options_table').style.top = (lz_chat_data.TopMargin) + "px";

            if(lz_chat_get_frame_object('lz_cf_ra') != null)
            {
                if(hideHeader)
                    lz_chat_get_frame_object('lz_cf_ra').appendChild(lz_chat_get_frame_object('lz_chat_feedback_init'));
                else
                    lz_chat_get_frame_object('lz_chat_feedback_init_frame').appendChild(lz_chat_get_frame_object('lz_chat_feedback_init'));
            }
        }
    }


    return !hideHeader;
}