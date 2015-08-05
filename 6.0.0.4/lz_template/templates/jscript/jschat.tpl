function lz_chat_show_waiting_message()
{
	if(lz_chat_data.Status.Status != lz_chat_data.STATUS_ACTIVE && lz_chat_data.Status.Status != lz_chat_data.STATUS_CLOSED && lz_chat_data.Status.Status != lz_chat_data.STATUS_STOPPED && !lz_chat_data.WaitingMessageAppended)
	{
		if(!lz_chat_data.CallMeBackMode)
			lz_chat_add_system_text(5,"");
		lz_chat_data.WaitingMessageAppended = true;
	}
}

function lz_chat_change_voucher_init()
{
	lz_chat_dialog(lz_chat_data.ComChatVoucherChangeHTML,lz_chat_get_frame_object(''),lz_chat_change_voucher_proceed,null,false);
}

function lz_chat_change_voucher_proceed()
{
	lz_chat_get_frame_object('lz_chat_dialog').style.display = 'none';
	for (var v in lz_chat_data.ComChatVouchers)
		for(var radio in lz_chat_get_frame_object('').getElementsByName("voucher_select"))
			if(lz_chat_get_frame_object('').getElementsByName("voucher_select")[radio].checked)
				if(lz_chat_data.ComChatVouchers[v].Id == lz_chat_get_frame_object('').getElementsByName("voucher_select")[radio].value)
					lz_chat_data.ComChatVoucherActive = lz_chat_data.ComChatVouchers[v];
}

function lz_chat_set_signature(_userId)
{			
	lz_chat_data.ExternalUser.Session.UserId = _userId;
	lz_chat_data.ExternalUser.Session.Save();
}

function lz_chat_buy_voucher_validate_form()
{
	var fields = {email:"email",firstname:"firstname",lastname:"lastname",address_1:"address_1",city:"city",zip:"zip"};
	var missing = false;
	for(fieldid in fields)
	{
		lz_chat_get_frame_object("lz_form_checkout_mandatory_" + fields[fieldid]).style.display = (lz_chat_get_frame_object('').getElementsByName("form_" + fields[fieldid])[0].value.length > 0) ? "none" : "";
		if(lz_chat_get_frame_object('').getElementsByName("form_" + fields[fieldid])[0].value.length == 0)
			missing = true;
	}
	lz_chat_get_frame_object("lz_form_checkout_mandatory_country").style.display = (lz_chat_get_frame_object('').getElementsByName("form_country")[0].selectedIndex > 0) ? "none" : "";
	if(lz_chat_get_frame_object('').getElementsByName("form_country")[0].selectedIndex == 0)
	{
		missing = true;
	}
	
	if(missing)
		lz_chat_dialog(lz_chat_data.Language.FillMandatoryFields,lz_chat_get_frame_object(''),null,null,null,true);
	return !missing;
}

function lz_chat_buy_voucher_proceed_to_payment()
{
	if(lz_chat_buy_voucher_validate_form())
	{
		lz_chat_get_frame_object('proceed_to_payment_button').disabled = true;
		lz_chat_get_frame_object('checkout_form').submit();
	}
}

function lz_chat_buy_voucher_calculate(_vat_amount,_currency,_priceFormatted,_priceUnformatted,_vouchertype)
{
	lz_chat_get_frame_object('vat_amount').innerHTML= "(" + _vat_amount + '&nbsp;' + _currency+")";
	lz_chat_get_frame_object('total_amount').innerHTML = "<b>" + _priceFormatted + '</b>&nbsp;' + _currency + "&nbsp;&nbsp;";
	lz_chat_get_frame_object('total_label').style.display = '';
	lz_chat_get_frame_object('proceed_to_details_button').disabled = false;
	lz_chat_get_frame_object('').getElementsByName('form_total_price')[0].value = _priceUnformatted;
	lz_chat_get_frame_object('').getElementsByName('form_vat')[0].value = _vat_amount;
	lz_chat_get_frame_object('').getElementsByName('form_currency')[0].value = _currency;
	lz_chat_get_frame_object('').getElementsByName('form_voucher_type')[0].value = _vouchertype;
	lz_chat_get_frame_object('').getElementsByName('form_group')[0].value = lz_chat_data.SelectedGroup.Id;
	lz_chat_get_frame_object('').getElementsByName('form_visitor_id')[0].value = lz_chat_data.ExternalUser.Session.UserId;
	lz_chat_get_frame_object('lz_chat_buy_voucher_tos').value = lz_global_base64_url_decode(lz_chat_get_frame_object('voucher_tos_' + _vouchertype).value);
}

function lz_chat_buy_voucher_navigate(_target,_reverse)
{
	if("<!--checkout_url-->" != "")
	{
		window.location = "<!--checkout_url-->";
        window.moveTo(0,0)
        window.resizeTo(screen.width,screen.height)
		return;
	}
	lz_chat_get_frame_object('proceed_to_payment_button').disabled = false;
	for(var i=0;i<lz_chat_get_frame_object('').getElementsByName("voucher_item").length;i++)
	{
		var found = false;
		for(var x=0;x<lz_chat_data.SelectedGroup.ChatVouchersRequired.length;x++)
			if(lz_chat_data.SelectedGroup.ChatVouchersRequired[x] == lz_chat_get_frame_object('').getElementsByName("voucher_item")[i].id)
			{
				found = true;
				break;
			}
		lz_chat_get_frame_object('').getElementsByName("voucher_item")[i].style.display = (found) ? "" : "none";
	}

	if(_target == "cancel" && !lz_chat_data.CheckoutOnly)
		_target = "start_chat";
	else if(_target == "cancel")
		_target = "voucher_select";

	if(_target == "accept_tos" && lz_chat_get_frame_object('lz_chat_buy_voucher_tos').value.length==0)
	{
		if(_reverse)
			_target = "voucher_select";
		else
			_target = "enter_details";
	}

	lz_chat_data.CheckoutActive = _target != "start_chat";

	lz_chat_get_frame_object('lz_chat_extend_voucher_success').style.display = (_target == "voucher_extend_success") ? "" : "none";

    lz_chat_get_frame_object('lz_input_header_box').style.display=
	lz_chat_get_frame_object('lz_chat_login').style.display = (_target == "start_chat") ? "" : "none";
	lz_chat_get_frame_object('lz_chat_buy_voucher').style.display = (_target == "voucher_select") ? "" : "none";
	lz_chat_get_frame_object('lz_chat_checkout_details').style.display = (_target == "enter_details") ? "" : "none";
	lz_chat_get_frame_object('lz_chat_checkout_tos').style.display = (_target == "accept_tos") ? "" : "none";
	lz_chat_get_frame_object('lz_chat_checkout_cancel').style.display = (!lz_chat_data.CheckoutOnly) ? "" : "none";
	lz_chat_get_frame_object('lz_chat_com_voucher_pp').style.display = (_target == "start_chat") ? "none" : ((lz_chat_get_frame_object('lz_chat_com_voucher_pp').src.length > 0) ? "" : "none");
}

function lz_chat_initiate_forwarding(_group,_auto)
{
	if(lz_chat_data.QueueMessageAppended)
	{
		lz_chat_get_frame_object('lz_chat_queue_position').id = "oq_a" + lz_global_timestamp();
		lz_chat_get_frame_object('lz_chat_queue_waiting_time').id = "oq_b" + lz_global_timestamp();
		lz_chat_data.QueueMessageAppended = false
	}

    if(!_auto)
    {
	    lz_chat_data.ConnectedMessageAppended = false;
    }

	lz_chat_data.WaitingMessageAppended = false;
	lz_chat_set_host('','','','',false,false,'',lz_chat_data.FeedbackPossible);
	
    if(!_auto)
	    lz_chat_add_system_text(0,null);

	lz_chat_set_intern_image(0,'',false);
	lz_chat_set_group(_group);

	lz_chat_set_status(lz_chat_data.STATUS_ALLOCATED);
}

function lz_chat_message(_translation,_original) 
{
	if(_original=='')
		var msg = lz_chat_get_frame_object('lz_chat_text').value;
	if(_original != '')
		msg = _original;

	if(lz_chat_data.Status.Status == lz_chat_data.STATUS_STOPPED)
		return lz_chat_dialog(lz_chat_data.Language.RepresentativeLeft,null,null,null);
	else if(msg.length > 0 && lz_global_trim(msg).length > 0 && msg.length <= lz_chat_data.MAXCHATLENGTH)
	{
		var sendmsg = true;

		if(lz_chat_get_frame_object('lz_translation_service_active').checked && _original=='' && isNaN(msg))
		{
			var transfrom = lz_chat_get_frame_object('lz_chat_translation_target_language').options[lz_chat_get_frame_object('lz_chat_translation_target_language').selectedIndex].value;
			var transinto = (lz_chat_data.TranslateInto!=null) ? lz_chat_data.TranslateInto : lz_chat_data.InternalUser.Language;
            sendmsg = transfrom == transinto;
			if(!sendmsg)
			{
				var newScript = document.createElement('script');
				newScript.type = 'text/javascript';
				var sourceText = encodeURI(msg);
				window.doneTranslateCallback = function translateText(response){if(response.data!=null){lz_chat_message(response.data.translations[0].translatedText,msg);window.doneTranslateCallback=null;}else{lz_chat_dialog("Sorry, there was an error while trying to translate:<br><br>" + JSON.stringify(response),lz_chat_get_frame_object(''),null);lz_chat_get_frame_object('lz_translation_service_active').checked=false;lz_chat_message("",msg);}}
				var source = "https://www.googleapis.com/language/translate/v2?key=<!--gtv2_api_key-->&format=html&source="+transfrom+"&target="+transinto+"&callback=doneTranslateCallback&q=" + msg;
				newScript.src = source;
				lz_document_head.appendChild(newScript);
			}
		}
		if(sendmsg)
		{
			var message = new lz_chat_post();
			message.MessageText = msg;
            if(_translation != null)
			    message.MessageTranslation = _translation;
			message.MessageId = lz_chat_data.MessageCount++;
			lz_chat_data.ExternalUser.Typing = false;
			lz_chat_data.ExternalUser.PreMessage = null;
			lz_chat_add_extern_text(msg,_translation,true);
			lz_chat_data.ExternalUser.MessagesSent[lz_chat_data.ExternalUser.MessagesSent.length] = message;
			lz_chat_shout(10);
		}
	}
	else if(msg.length > lz_chat_data.MAXCHATLENGTH)
		return lz_chat_dialog(lz_chat_data.Language.MessageTooLong,null,null);

	setTimeout("lz_chat_clear_field()",1);
	return false;
}

function lz_chat_repost_from_queue(_post)
{
	if(!lz_chat_data.QueuePostsAdded)
	{
		var message = new lz_chat_post();
		message.MessageText = lz_global_base64_url_decode(_post);
		message.MessageId = lz_chat_data.MessageCount++;
		lz_chat_add_extern_text("<i>" + lz_global_base64_url_decode(_post) + "</i>","",false);
		lz_chat_data.ExternalUser.MessagesSent[lz_chat_data.ExternalUser.MessagesSent.length] = message;
	}
}

function lz_chat_clear_field()
{
	lz_chat_get_frame_object('lz_chat_text').value = "";
	lz_chat_focus_textbox();
}

function lz_chat_focus_textbox()
{
    document.getElementById("lz_chat_content").contentWindow.focus();
	lz_chat_get_frame_object('lz_chat_text').focus();
}

function lz_chat_dialog(_text,_object,_event,_buttonText,_showIcon,_shadow,_size,_src,_print)
{
    if(lz_chat_get_frame_object('lz_chat_dialog').style.display != 'none')
    {
        if(lz_chat_get_frame_object('lz_chat_dialog_button').onmouseup)
        {
            return;
        }
        lz_chat_dialog_close();
    }

    if(!lz_chat_data.IsIOS)
        lz_chat_get_frame_object('lz_chat_dialog_resource_frame').style.overflow = 'hidden';

    lz_chat_get_frame_object('lz_chat_dialog_text').innerHTML = "";

    if(_object != null)
    {
        if(_object != 'lz_chat_file_frame')
        {
            lz_chat_data.DialogObject = _object;
            lz_chat_data.DialogObjectParent = _object.parentNode;
            lz_chat_get_frame_object('lz_chat_dialog_text').appendChild(_object);
        }
        else
        {
            //lz_chat_get_frame_object('lz_chat_dialog_text_frame').style.display = "none";
            lz_chat_get_frame_object('lz_chat_file_frame').style.display = "block";
        }
    }
    else if(_text)
        lz_chat_get_frame_object('lz_chat_dialog_text').innerHTML = _text;


    lz_chat_get_frame_object('lz_chat_dialog_text_frame').style.display = ((_object == null && _src == null) || (_object != null && _object != 'lz_chat_file_frame')) ? 'block' : 'none';
    lz_chat_get_frame_object('lz_chat_dialog_text').style.display = (_text || _object) ? '' : 'none';
    lz_chat_get_frame_object('lz_chat_dialog_print').style.display = (_print) ? '' : 'none';
    lz_chat_get_frame_object('lz_chat_dialog_resource_frame').style.display = (_src) ? '' : 'none';

    lz_chat_get_frame_object('lz_chat_dialog_button').onclick = function(){lz_chat_dialog_close()};

	if(_event == -1)
        lz_chat_get_frame_object('lz_chat_dialog_button').disabled = true;
	else if(_event != null)
    {
        lz_chat_get_frame_object('lz_chat_dialog_button').onclick = _event;
        lz_chat_get_frame_object('lz_chat_dialog_button').onmouseup = function(){lz_chat_dialog_close()};
    }

	if(_buttonText != null)
        lz_chat_get_frame_object('lz_chat_dialog_button').value = _buttonText;
    else
        lz_chat_get_frame_object('lz_chat_dialog_button').value = "Ok";

    if(_src)
    {
        lz_chat_data.DialogSource = _src;
        if(_size != null)
        {
            lz_chat_get_frame_object('lz_chat_dialog_resource_frame').style.height = parseInt(lz_global_get_window_height()*_size[0])+"px";
            lz_chat_get_frame_object('lz_chat_dialog_resource_frame').style.width = parseInt(lz_global_get_window_width()*_size[1])+"px";
        }
        if(!lz_chat_data.FeedbackOnExit || !lz_chat_get_frame_object('lz_chat_dialog_resource').src.endsWith(lz_chat_data.DialogSource.replace("./","")))
        {
            lz_chat_get_frame_object('lz_chat_dialog_bg').style.cursor = "wait";
            lz_chat_dialog_set_onload_event(lz_chat_get_frame_object('lz_chat_dialog_resource'),lz_chat_dialog_resource_loaded);
            lz_chat_get_frame_object('lz_chat_dialog_resource').src = lz_chat_data.DialogSource;
        }
        else
            lz_chat_get_frame_object('lz_chat_dialog').style.display = 'inline-block';
    }
    else
        lz_chat_get_frame_object('lz_chat_dialog').style.display = 'inline-block';

    lz_chat_get_frame_object('lz_chat_dialog_bg').style.display = 'block';
}

function lz_chat_dialog_close()
{
    lz_chat_get_frame_object('lz_chat_file_frame').style.display = "none";
    lz_chat_get_frame_object('lz_chat_dialog_text_frame').style.display = "block";
    if(lz_chat_data.DialogObject != null)
    {
        lz_chat_data.DialogObjectParent.appendChild(lz_chat_data.DialogObject);
        lz_chat_data.DialogObject = lz_chat_data.DialogParentObject = null;
    }
    lz_chat_get_frame_object('lz_chat_dialog_bg').style.display = 'none';
    lz_chat_get_frame_object('lz_chat_dialog').style.display = 'none';

    if(lz_chat_data.FeedbackOnExit && lz_chat_data.DialogSource && lz_chat_data.DialogSource != lz_chat_data.FeedbackURL)
    {
        lz_chat_dialog_set_onload_event(lz_chat_get_frame_object('lz_chat_dialog_resource'),new function(){});
        lz_chat_get_frame_object('lz_chat_dialog_resource').src = lz_chat_data.DialogSource = lz_chat_data.FeedbackURL;
    }
    else
        lz_chat_data.DialogSource = null;
}

function lz_chat_dialog_set_onload_event(_iframe,_function)
{
    _iframe.onload = _function;
}

function lz_chat_dialog_resource_loaded()
{
    lz_chat_get_frame_object('lz_chat_dialog_bg').style.cursor = "auto";
    lz_chat_get_frame_object('lz_chat_dialog').style.display = 'inline-block';
}

function lz_chat_take_smiley(_smiley)
{
	var sign = "";
	switch(_smiley)
	{
		case"smile":sign = ":-)";break;
		case"sad":sign = ":-(";break;
		case"neutral":sign = ":-|";break;
		case"tongue":sign = ":-P";break;
		case"cry":sign = ":'-(";break;
		case"lol":sign = ":-]";break;
		case"shocked":sign = ":-O";break;
		case"wink":sign = ";-)";break;
		case"cool":sign = "8-)";break;
		case"sick":sign = ":-\\\\";break;
		case"question":sign = ":?";break;
		case"sleep":sign = "zzZZ";break;
	}
	lz_chat_switch_emoticons();
	lz_chat_get_frame_object('lz_chat_text').value += sign;
	lz_chat_focus_textbox();

    lz_chat_get_frame_object('lz_chat_emoticons_container').appendChild(lz_chat_get_frame_object('lz_chat_emoticons_frame'));
    lz_chat_get_frame_object('lz_chat_dialog_bg').style.display = 'none';
    lz_chat_get_frame_object('lz_chat_dialog').style.display = 'none';
}

function lz_chat_call_back_info(_html)
{
    lz_chat_get_frame_object('lz_chat_call_me_back_st').innerHTML = lz_global_base64_decode(_html);
    lz_chat_get_frame_object('lz_chat_call_me_back_wa').innerHTML = '';
}

function lz_chat_clear_room_members(_id,_leftDynamicGroup)
{
    if((lz_chat_data.InternalUser.Available && _id.length == 0) || _id.length > 0)
    {
        for(var i=0;i<lz_chat_data.MembersPrevious.length;i++)
        {
            if(lz_array_indexOf(lz_chat_data.Members,lz_chat_data.MembersPrevious[i]) == -1)
            {
                var node = lz_chat_get_frame_object("").getElementById('rm_' + lz_chat_data.MembersPrevious[i]);
                if(!_leftDynamicGroup && lz_chat_data.DynamicGroup != '')
                    lz_chat_add_system_text(10,lz_global_base64_encode(node.innerHTML));
                lz_chat_get_frame_object('lz_chat_members_box').removeChild(node);
            }
        }
        lz_chat_data.MembersPrevious = lz_chat_data.Members;
        lz_chat_data.Members = new Array();
    }
}

function lz_chat_set_room_member(_id,_fullname,_isOperator,_isBusyAway,_inDynamicGroup)
{
    _id = lz_global_base64_decode(_id);

    if((lz_chat_data.InternalUser != null && lz_chat_data.InternalUser.Id != "") || !_inDynamicGroup)
        if(lz_array_indexOf(lz_chat_data.MembersPrevious,_id) == -1 && lz_array_indexOf(lz_chat_data.Members,_id) == -1)
        {
            if(!_inDynamicGroup || lz_chat_data.DynamicGroup != '')
                lz_chat_add_system_text(1,_fullname);
        }

    if(lz_array_indexOf(lz_chat_data.Members,_id) == -1)
    {
        lz_chat_data.Members[lz_chat_data.Members.length] = _id;
        if(!lz_chat_get_frame_object("").getElementById('rm_' + _id))
        {
            var me = document.createElement('div');
            me.innerHTML = lz_global_base64_decode(_fullname);
            me.id = 'rm_' + _id;
            me.className = 'lz_chat_members_back_item ' + ((!_isOperator) ? 'lz_chat_members_back_external' : 'lz_chat_members_back_internal');
            lz_chat_get_frame_object('lz_chat_members_box').appendChild(me);
        }
    }

    if(lz_chat_get_frame_object("").getElementById('rm_' + _id))
    {
        if(lz_chat_get_frame_object("").getElementById('rm_' + _id).innerHTML != lz_global_base64_decode(_fullname))
            lz_chat_get_frame_object("").getElementById('rm_' + _id).innerHTML = lz_global_base64_decode(_fullname);

        lz_chat_get_frame_object("").getElementById('rm_' + _id).style.fontStyle = (_isBusyAway) ? 'italic' : 'normal';
    }

    if(lz_chat_data.Members.length > 2 || lz_chat_data.DynamicGroup != '')
    {
        lz_chat_get_frame_object('lz_chat_members_box').style.display = 'block';
        lz_chat_get_frame_object('lz_chat_main').style.right = "137px";
    }
}

function lz_chat_set_host(_id,_fullname,_groupname,_language,_typing,_vcard,_dygroup,_feedback)
{
	if(_id.length > 0)
	{
		lz_chat_data.InternalUser.Id = (lz_global_base64_decode(_id));
		lz_chat_data.InternalUser.Fullname = (_fullname.length > 0) ? (lz_global_base64_decode(_fullname)) : lz_chat_data.InternalUser.Id;
		lz_chat_data.InternalUser.Language = _language;
        lz_chat_get_frame_object('lz_chat_operator_fullname').innerHTML = lz_chat_data.InternalUser.Fullname;
        lz_chat_get_frame_object('lz_chat_operator_groupname').innerHTML = (lz_global_base64_decode(_groupname));
        lz_chat_get_frame_object('lz_chat_vcard_text').href = "./visitcard.php?intid=" + encodeURIComponent(lz_chat_data.InternalUser.Id);
		lz_chat_get_frame_object('lz_chat_operator_typing_info').innerHTML = lz_chat_data.Language.RepresentativeIsTyping.replace("<!--operator_name-->",lz_chat_data.InternalUser.Fullname);
	}

	if(lz_global_base64_decode(_dygroup) == '' && _dygroup != lz_chat_data.DynamicGroup && lz_chat_data.DynamicGroup != '')
	{
        lz_chat_add_system_text(12,lz_chat_data.DynamicGroup);
		lz_chat_data.DynamicGroup = '';
	}

    var leftDynamicGroup = false;
	if(_dygroup != '' && _dygroup != lz_chat_data.DynamicGroup)
	{
        lz_chat_data.FeedbackPossible = false;
		lz_chat_add_system_text(11,_dygroup);
		lz_chat_data.DynamicGroup = _dygroup;
        leftDynamicGroup = true;
	}

    lz_chat_clear_room_members(_id, leftDynamicGroup);
	lz_chat_data.InternalUser.Available = (_id.length > 0);
	lz_chat_get_frame_object('lz_chat_subline').style.display = (_id.length > 0 && _typing) ? "block" : "none";

    if(!_feedback)
        lz_chat_data.FeedbackPossible =_feedback;

    var showHeader = lz_chat_show_header();
    lz_chat_get_frame_object('lz_chat_vcard_box').style.display = (_id.length > 0 && _vcard) ? "" : "none";
    lz_chat_get_frame_object('lz_chat_logo').style.visibility = (!showHeader && _id.length > 0 && lz_chat_data.ShowOperatorInfoBox) ? "hidden" : "visible";
    lz_chat_get_frame_object('lz_chat_top_bg').style.visibility = (showHeader && (_id.length == 0 || !lz_chat_data.ShowOperatorInfoBox)) ? "visible" : "hidden";
    lz_chat_get_frame_object('lz_chat_feedback_init').style.visibility = (lz_chat_data.FeedbackPossible && _id.length > 0 && lz_chat_data.ShowOperatorInfoBox) ? "visible" : "hidden";
    lz_chat_get_frame_object('lz_chat_representative').style.visibility = (_id.length > 0 && lz_chat_data.ShowOperatorInfoBox) ? "visible" : "hidden";
}

function lz_chat_set_intern_image(_edited,_file,_filtered)
{
	if(_edited == 0 || _filtered)
	{
		lz_chat_data.TempImage.src = "./images/avatar.png";
	}
	else if(_edited != lz_chat_data.InternalUser.ProfilePictureTime)
	{
		lz_chat_data.TempImage.src = "./" + _file;
		lz_chat_data.InternalUser.ProfilePictureTime = _edited;
	}
}

function lz_chat_show_intern_image()
{
    lz_chat_get_frame_object('lz_chat_intern_image').style.backgroundImage = "url("+lz_chat_data.TempImage.src+")";
}

function lz_chat_switch_extern_typing(_typing)
{	
	var announce = (_typing != lz_chat_data.ExternalUser.Typing);
	if(_typing)
	{
		if(lz_chat_data.TimerTyping != null)
			clearTimeout(lz_chat_data.TimerTyping);
		lz_chat_data.TimerTyping = setTimeout("lz_chat_switch_extern_typing(false);",5000);
		lz_switch_title_mode(false);
	}
	
	lz_chat_data.ExternalUser.Typing = _typing;
	lz_chat_data.ExternalUser.PreMessage = lz_chat_get_frame_object('lz_chat_text').value;
	
	if(announce)
		lz_chat_shout(11);
}

function lz_chat_show_connected(_group)
{
	if(!lz_chat_data.ConnectedMessageAppended)
	{
		lz_chat_data.ConnectedMessageAppended = true;
        if(!_group)
		    lz_chat_add_system_text(6,null);
	}
}

function lz_chat_show_queue_position(_position,_time,_html)
{
	if(!lz_chat_data.QueueMessageAppended)
	{
		var qmessage = lz_global_base64_decode(_html).replace("<!--queue_position-->","<span id='lz_chat_queue_position'>-1</span>");
		qmessage = qmessage.replace("<!--queue_waiting_time-->","<span id='lz_chat_queue_waiting_time'>-1</span>");
		lz_chat_add_system_text(-1,qmessage);
		lz_chat_data.QueueMessageAppended = true;
	}
	
	var cposition = parseInt(lz_chat_get_frame_object('lz_chat_queue_position').innerHTML);
	var cwtime = parseInt(lz_chat_get_frame_object('lz_chat_queue_waiting_time').innerHTML);
	
	if(_position == 1 && (cposition != _position))
		lz_chat_add_system_text(9,"");
		
	if(cposition == -1 || (_position > 0 && _position <= cposition))
		lz_chat_get_frame_object('lz_chat_queue_position').innerHTML = _position;
		
	if(cwtime == -1 || (_time > 0 && _time <= cwtime))
		lz_chat_get_frame_object('lz_chat_queue_waiting_time').innerHTML = _time;
}

function lz_chat_add_system_text(_type,_texta) 
{	
	var text = "";
	if(_type == 0)
		text = lz_chat_data.Language.ClientForwarding;
	else if(_type == 1)
		text = lz_chat_data.Language.ClientInternArrives.replace("<!--intern_name-->",(lz_global_base64_decode(_texta)));
	else if(_type == 2)
		text = lz_chat_data.Language.ClientErrorUnavailable + (lz_global_base64_decode(_texta));
	else if(_type == 3)
		text = lz_chat_data.Language.ClientIntLeft + " <a href=\"javascript:parent.lz_chat_goto_message(true,false);\"><b>" + lz_chat_data.Language.LanguageLeaveMessageShort + "</b></a>. " + lz_chat_data.Language.ClientThankYou;
	else if(_type == 4)
		text = lz_chat_data.Language.ClientIntDeclined + " <a href=\"javascript:parent.lz_chat_goto_message(true,false);\"><b>" + lz_chat_data.Language.LanguageLeaveMessageShort + "</b></a>. " + lz_chat_data.Language.ClientThankYou;
	else if(_type == 5)
		text = lz_chat_data.Language.ClientStillWaitingInt + " <a href=\"javascript:parent.lz_chat_goto_message(true,false);\"><b>" + lz_chat_data.Language.LanguageLeaveMessageShort + "</b></a>. " + lz_chat_data.Language.ClientThankYou;
	else if(_type == 6)
		text = lz_chat_data.Language.ClientIntIsConnected;
	else if(_type == 8)
		text = lz_chat_data.Language.ClientNoInternUsers + " <a href=\"javascript:parent.lz_chat_goto_message(true,false);\"><b>" + lz_chat_data.Language.LanguageLeaveMessageShort + "</b></a>. " + lz_chat_data.Language.ClientThankYou;
	else if(_type == 9)
		text = lz_chat_data.Language.NextOperator;
	else if(_type == 10)
		text = lz_chat_data.Language.ClientInternLeft.replace("<!--intern_name-->",(lz_global_base64_decode(_texta)));
	else if(_type == 11)
		text = lz_chat_data.Language.JoinGroup.replace("<!--group_name-->",(lz_global_base64_decode(_texta)));
	else if(_type == 12)
		text = lz_chat_data.Language.LeaveGroup.replace("<!--group_name-->",(lz_global_base64_decode(_texta)));
    else if(_type == 13)
        text = lz_chat_data.Language.ClientConnectingYou;
	else if(_type == 99)
		text = lz_global_base64_decode(_texta);
	else
		text = _texta;
		
	text = lz_global_replace_smilies(text,true);

	if(lz_chat_data.LastSender != lz_chat_data.SYSTEM)
	{
		text = lz_global_base64_decode(lz_chat_data.Templates.MessageExternal).replace("<!--message-->",text);
		lz_chat_data.AlternateRow = true;
	}
	else
	{
		if(lz_chat_data.AlternateRow)
			text = lz_global_base64_decode(lz_chat_data.Templates.MessageAddAlt).replace("<!--message-->",text);
		else
			text = lz_global_base64_decode(lz_chat_data.Templates.MessageAdd).replace("<!--message-->",text);
		lz_chat_data.AlternateRow = !lz_chat_data.AlternateRow;
	}
	text = text.replace("<!--time-->",lz_chat_get_locale_time());
	text = text.replace("<!--name-->",lz_chat_data.Language.System);
    text = text.replace("<!--align-->","left");
	lz_chat_append_text(text);
	lz_chat_data.LastSender = lz_chat_data.SYSTEM;
}

function lz_chat_add_internal_text(_text,_acid,_internalName,_repost) 
{
	_text = lz_global_base64_decode(_text);
	_acid = lz_global_base64_decode(_acid);

	var message = new lz_chat_post();
	var template = (_repost) ? lz_chat_data.Templates.MessageExternal : lz_chat_data.Templates.MessageInternal;
	message.MessageId = _acid;
	message.MessageText = _text;
	message.MessageTime = lz_global_timestamp();

	if(!lz_chat_message_is_received(message))
	{
        lz_chat_data.MessageCountReceived++;

        if(!lz_chat_data.ChatActive && lz_chat_data.MessageCountReceived>=1)
            lz_chat_activate();

        if(_repost)
            _text = "<i>" + _text + "</i>";

        if(lz_chat_data.LastSender != lz_chat_data.INTERNAL+_internalName)
        {
            _text = lz_global_base64_decode(template).replace("<!--message-->",_text);
            lz_chat_data.AlternateRow = true;
        }
        else
        {
            if(lz_chat_data.AlternateRow)
                _text = lz_global_base64_decode(lz_chat_data.Templates.MessageAddAlt).replace("<!--message-->",_text);
            else
                _text = lz_global_base64_decode(lz_chat_data.Templates.MessageAdd).replace("<!--message-->",_text);
            lz_chat_data.AlternateRow = !lz_chat_data.AlternateRow;
        }

		if(!_repost)
			_text = _text.replace("<!--time-->",lz_chat_get_locale_time());
		else
			_text = _text.replace("<!--time-->","");
			
		_text = _text.replace("<!--name-->",lz_global_base64_decode(_internalName));
		_text = lz_global_replace_smilies(_text,true);
        _text = _text.replace("<!--align-->","right");
		lz_switch_title_mode(true);
		lz_chat_append_text(_text);
		
		if(lz_chat_data.LastSound < (lz_global_timestamp()-1))
		{
			lz_chat_data.LastSound = lz_global_timestamp();
            if(lz_chat_get_frame_object('lz_chat_sound_button').style.display != 'none')
                lz_chat_play_sound();
		}
		lz_chat_data.LastSender = lz_chat_data.INTERNAL+_internalName;
	}
}

function lz_chat_message_is_received(_message)
{
	for(var mIndex in lz_chat_data.ExternalUser.MessagesReceived)
		if(lz_chat_data.ExternalUser.MessagesReceived[mIndex].MessageId == _message.MessageId)
			return true;
			
	lz_chat_data.ExternalUser.MessagesReceived[lz_chat_data.ExternalUser.MessagesReceived.length] = _message;
	lz_chat_shout(12);
	
	var mNewMessages = new Array();
	for(var mIndex in lz_chat_data.ExternalUser.MessagesReceived)
		if(lz_chat_data.ExternalUser.MessagesReceived[mIndex].MessageTime >= (lz_global_timestamp()-3600))
			mNewMessages[mNewMessages.length] = lz_chat_data.ExternalUser.MessagesReceived[mIndex];

	lz_chat_data.ExternalUser.MessagesReceived = mNewMessages;
	return false;
}

function lz_chat_message_set_received(_id)
{
	for(var mIndex in lz_chat_data.ExternalUser.MessagesReceived)
		if(lz_chat_data.ExternalUser.MessagesReceived[mIndex].MessageId == _id)
			return (lz_chat_data.ExternalUser.MessagesReceived[mIndex].Received = true);
	return true;
}

function lz_chat_set_id(_id)
{
	lz_chat_data.Id = _id;
	return true;
}

function lz_chat_add_extern_text(_text,_translation,_escape) 
{
	if(_escape)
		_text = lz_global_htmlentities(_text);
	_text = lz_global_replace_breaks(_text);

	if(_translation != '')
	{
		_translation = lz_global_htmlentities(_translation);
		_translation = lz_global_replace_breaks(_translation);
		_text = _translation + "<div class=\"lz_message_translation\">"+_text+"</div>";
	}
	
	if(lz_chat_data.LastSender != lz_chat_data.EXTERNAL)
	{
		_text = lz_global_base64_decode(lz_chat_data.Templates.MessageExternal).replace("<!--message-->",_text);
		lz_chat_data.AlternateRow = true;
	}
	else
	{
		if(lz_chat_data.AlternateRow)
			_text = lz_global_base64_decode(lz_chat_data.Templates.MessageAddAlt).replace("<!--message-->",_text);
		else
			_text = lz_global_base64_decode(lz_chat_data.Templates.MessageAdd).replace("<!--message-->",_text);
		lz_chat_data.AlternateRow = !lz_chat_data.AlternateRow;
	}
	_text = lz_global_replace_smilies(_text,true);
	_text = _text.replace("<!--time-->",lz_chat_get_locale_time());
    _text = _text.replace("<!--align-->","left");
	_text = _text.replace("<!--name-->",lz_global_htmlentities(lz_chat_data.ExternalUser.Username));
	_text = _text.replace("<!--align-->",lz_chat_data.ExternalUser.TextAlign);
	lz_chat_append_text(_text);
	lz_chat_data.LastSender = lz_chat_data.EXTERNAL;
}

function lz_chat_append_text(_html)
{
	window.focus();
	if(!lz_chat_data.Status.Loaded)
		return;

	var newMessage = lz_chat_get_frame_object('').createElement("DIV");

	newMessage.innerHTML = _html;
	lz_chat_get_frame_object('lz_chat_main').appendChild(newMessage);

    var links = newMessage.getElementsByTagName("a");
    if(links.length > 0)
        for (link in links)
            if(links[link].target=="" && links[link].href.indexOf("javascript") == -1)
                links[link].target = "_blank";

    lz_chat_scroll_down();

	if(lz_chat_data.Status.Status < lz_chat_data.STATUS_STOPPED)
		lz_chat_focus_textbox();
}

function lz_chat_scroll_down()
{
    lz_chat_get_frame_object('lz_chat_main').scrollTop = lz_chat_get_frame_object('lz_chat_main').scrollHeight;
}

function lz_chat_print() 
{
    var pURL = "./print.php?c=" + lz_global_base64_url_encode(lz_chat_data.Id) + "&b=" + lz_global_base64_url_encode(lz_chat_data.ExternalUser.Session.BrowserId) + "&i=" + lz_global_base64_url_encode(lz_chat_data.ExternalUser.Session.UserId) + "&r=" + Math.random().toString();
    lz_chat_dialog(null,null,null,lz_chat_data.Language.Close,null,true,new Array(0.82,0.94),pURL,true);
}

function lz_chat_release_post(_id)
{	
	if(lz_chat_data.Status.Status < lz_chat_data.STATUS_STOPPED)
	{
		newMessageList = new Array();
		for (var mIndex in lz_chat_data.ExternalUser.MessagesSent)
			if(lz_chat_data.ExternalUser.MessagesSent[mIndex].MessageId != _id)
				newMessageList[newMessageList.length] = lz_chat_data.ExternalUser.MessagesSent[mIndex];
		lz_chat_data.ExternalUser.MessagesSent = newMessageList;
	}
}

function lz_chat_change_window_state(_minimized)
{
	lz_switch_title_mode(_minimized);
}

function lz_chat_update_com_chat_data(_timer)
{
	if(lz_chat_data.Status.Status == lz_chat_data.STATUS_ACTIVE)
	{
		lz_chat_data.ComChatVoucherActive.ChatTime++;
		if(_timer)
			lz_chat_data.ComChatSessionTimer = setTimeout("lz_chat_update_com_chat_data(true);",1000);
	}

	if(lz_chat_data.ComChatVoucherActive.ChatTimeMax > 0)
		lz_chat_get_frame_object('lz_chat_com_chat_chat_length_value').innerHTML = lz_format_time_span(lz_chat_data.ComChatVoucherActive.ChatTimeMax - lz_chat_data.ComChatVoucherActive.ChatTime);
	else
		lz_chat_get_frame_object('lz_chat_com_chat_chat_length_value').innerHTML = lz_format_time_span(lz_chat_data.ComChatVoucherActive.ChatTime);
	
	lz_chat_get_frame_object('lz_chat_com_chat_chat_amount_value').innerHTML = lz_chat_data.ComChatVoucherActive.ChatSessions + ((lz_chat_data.ComChatVoucherActive.ChatSessionsMax == -1) ? "" : " / " + lz_chat_data.ComChatVoucherActive.ChatSessionsMax);
	
	var date = new Date(lz_chat_data.ComChatVoucherActive.Expires*1000);
	
	lz_chat_get_frame_object('lz_chat_com_chat_chat_period_value').innerHTML = date.toLocaleDateString();
	
	if(lz_chat_data.ComChatVoucherActive.ChatSessionsMax > -1 && lz_chat_data.ComChatVoucherActive.ChatSessionsMax <= lz_chat_data.ComChatVoucherActive.ChatSessions)
		lz_chat_get_frame_object('lz_chat_com_chat_chat_amount_value').className = 'lz_chat_com_chat_panel_value_over';
	else
		lz_chat_get_frame_object('lz_chat_com_chat_chat_amount_value').className = 'lz_chat_com_chat_panel_value';
		
	if(lz_chat_data.ComChatVoucherActive.ChatTime >= lz_chat_data.ComChatVoucherActive.ChatTimeMax && lz_chat_data.ComChatVoucherActive.ChatTimeMax > -1)
		lz_chat_get_frame_object('lz_chat_com_chat_chat_length_value').className = 'lz_chat_com_chat_panel_value_over';
	else
		lz_chat_get_frame_object('lz_chat_com_chat_chat_length_value').className = 'lz_chat_com_chat_panel_value';
		
	if(lz_chat_data.ComChatVoucherActive.Expired)
		lz_chat_get_frame_object('lz_chat_com_chat_chat_period_value').className = 'lz_chat_com_chat_panel_value_over';
	else
		lz_chat_get_frame_object('lz_chat_com_chat_chat_period_value').className = 'lz_chat_com_chat_panel_value';
		
	lz_chat_get_frame_object('lz_chat_com_chat_chat_amount_value').style.display =
	lz_chat_get_frame_object('lz_chat_com_chat_chat_amount_caption').style.display = (lz_chat_data.ComChatVoucherActive.ChatSessionsMax > -1) ? "" : "none";
		
	lz_chat_get_frame_object('lz_chat_com_chat_chat_length_value').style.display =
	lz_chat_get_frame_object('lz_chat_com_chat_chat_length_caption').style.display = (lz_chat_data.ComChatVoucherActive.ChatTimeMax > -1) ? "" : "none";
	lz_chat_get_frame_object('lz_chat_com_chat_chat_length_spacer').style.display = (lz_chat_data.ComChatVoucherActive.ChatSessionsMax > -1 && lz_chat_data.ComChatVoucherActive.ChatTimeMax > -1) ? "" : "none";

	lz_chat_get_frame_object('lz_chat_com_chat_chat_period_spacer').style.display = (lz_chat_data.ComChatVoucherActive.Expires > 0 && (lz_chat_data.ComChatVoucherActive.ChatSessionsMax > -1 || lz_chat_data.ComChatVoucherActive.ChatTimeMax > -1)) ? "" : "none";
	lz_chat_get_frame_object('lz_chat_com_chat_chat_period_caption').style.display =
	lz_chat_get_frame_object('lz_chat_com_chat_chat_period_value').style.display = (lz_chat_data.ComChatVoucherActive.Expires > 0) ? "" : "none";

	lz_chat_get_frame_object('lz_chat_com_chat_chat_voucher_id').style.display = (lz_chat_data.ComChatVoucherActive.Expires == -1 && lz_chat_data.ComChatVoucherActive.ChatSessionsMax == -1 && lz_chat_data.ComChatVoucherActive.ChatTimeMax == -1) ? "" : "none";
	lz_chat_get_frame_object('lz_chat_com_chat_chat_voucher_id').innerHTML = lz_chat_data.ComChatVoucherActive.Id;
}

function lz_chat_set_status(_status)
{	
	if(_status == lz_chat_data.STATUS_ACTIVE)
	{
		var buttons = {sm:"SM",so:"SO",pr:"PR",fu:"FU",tr:"TR",et:"ET"};
		if(lz_chat_data.ChatActive)
            for(buttinid in buttons)
                lz_chat_get_frame_object('lz_cf_' + buttinid).style.display = lz_chat_get_frame_object('lz_cf_value_' + buttinid).value;
		if(lz_chat_data.TimerWaiting != null)
			clearTimeout(lz_chat_data.TimerWaiting);
		if(lz_chat_data.Status.Status != _status && lz_chat_data.ComChatVoucherActive != null)
			lz_chat_data.ComChatSessionTimer = setTimeout("lz_chat_update_com_chat_data(true);",1000);
	}
	else if(_status == lz_chat_data.STATUS_INIT && lz_chat_data.TimerWaiting == null && <!--show_waiting_message-->)
		lz_chat_data.TimerWaiting = setTimeout("lz_chat_show_waiting_message();",<!--waiting_message_time-->*1000);
	if(lz_chat_data.Status.Status < lz_chat_data.STATUS_STOPPED)
		lz_chat_data.Status.Status = _status;

    if(_status == lz_chat_data.STATUS_ACTIVE)
    {
        lz_chat_data.FeedbackURL = "./feedback.php?cid=" + lz_global_base64_url_encode(lz_chat_data.Id);
        if(lz_chat_data.FeedbackOnExit)
            lz_chat_get_frame_object('lz_chat_dialog_resource').src = lz_chat_data.FeedbackURL;
        lz_chat_get_frame_object('lz_chat_callback_feedback').disabled=false;
        lz_chat_get_frame_object('lz_chat_callback_feedback').className='lz_form_button';
    }
}

function lz_chat_handle_response(_status, _response)
{
	lz_chat_data.LastConnectionFailed = false;
	lz_chat_data.ConnectionRunning = false;
	lz_chat_process_xml(_response);
}

function lz_chat_handle_shout_response(_status, _response)
{
	lz_chat_process_xml(_response);
	setTimeout("lz_chat_reshout()",lz_chat_data.ChatFrequency * 1000);
}

function lz_chat_process_xml(_xml)
{
	try
	{
		if(_xml.length > 0 && _xml.indexOf("<livezilla_js>") != -1)
		{
			lz_chat_data.LastConnection = lz_global_timestamp();
			var lzTstart = "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><livezilla_js>";
			var lzTend = "</livezilla_js>";
			eval(lz_global_base64_decode(_xml.substr(_xml.indexOf(lzTstart) + lzTstart.length,_xml.indexOf(lzTend)-_xml.indexOf(lzTstart)-lzTstart.length)));
		}
		else if(lz_chat_data.Status.Status < lz_chat_data.STATUS_INIT)
			setTimeout("lz_chat_handle_connection_error(null,null);",2000);
	}
	catch(ex)
    {
        if(lz_chat_data.Debug)
            alert(ex);
    }
}

function lz_chat_handle_connection_error(_status, _response)
{
	lz_chat_data.ShoutNeeded = true;
	lz_chat_data.ConnectionRunning = 
	lz_chat_data.ShoutRunning = false;
	lz_chat_data.LastConnectionFailed = true;
	if(lz_chat_data.Status.Status < lz_chat_data.STATUS_INIT)
		setTimeout("lz_chat_reload_groups();",5000);
}

function lz_chat_feedback_result()
{
    lz_chat_data.FeedbackOnExit = false;
}

function lz_chat_show_feedback(_showError)
{
    if(lz_chat_data.FeedbackPossible)
    {
        lz_chat_switch_options(true);
        lz_chat_dialog(null,null,null,lz_chat_data.Language.Close,null,true,new Array(0.80,0.94),lz_chat_data.FeedbackURL);
    }
    return true;
}
