<form action="./upload.php?f=MQ__<!--website-->" method="post" enctype="multipart/form-data" name="lz_file_form">
    <input type="file" id="lz_chat_file_file" name="form_userfile" style="<!--mwidth-->" class="unselectable">
    <div id="lz_chat_file_load" class="lz_anim_loading"></div>
    <br>
    <input type="button" id="lz_chat_file_send" class="lz_form_button" value="<!--lang_client_send-->" onclick="<!--action-->">
    <br>
    <table id="lz_chat_file_status_table">
        <tr>
            <td>
                <img id="lz_chat_file_success" src="./images/icon_file_upload_success.png" alt="">
                <img id="lz_chat_file_error" src="./images/icon_file_upload_error.gif" alt="" width="35" height="26">
            </td>
            <td id="lz_chat_file_status"></td>
        </tr>
    </table>
    <input type="hidden" name="p_request" value="extern">
    <input type="hidden" name="p_action" value="file_upload">
    <input type="hidden" value="<!--cid-->" name="cid">
</form>