<input type="hidden" id="lz_form_active_<!--name-->" value="<!--active-->">
<table  id="lz_form_<!--name-->" class="lz_input">
	<tr>
        <td id="lz_form_caption_<!--name-->" class="lz_form_field" style="background:transparent;text-align:right;padding-top:6px;">
            <input class="lz_form_check" name="form_<!--name-->" type="checkbox" onchange="return parent.lz_chat_save_input_value('<!--name-->',((this.checked) ? '1' : '0'));">
        </td>
        <td style="vertical-align: middle;">
            <!--caption-->
            <div class="lz_form_info_box" id="lz_form_info_<!--name-->" style="border-radius:3px;margin-top:4px;padding:5px;"><!--info_text--></div></td>
        <td class="lz_form_icon"><div id="lz_form_mandatory_<!--name-->" style="display:none;"></div></td>
	</tr>
</table>
