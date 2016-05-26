<div onclick="lz_chat_change_state(true,false);" id="lz_overlay_eyecatcher" style="display:none;">
    <div id="lz_overlay_eyecatcher_avatar" style="display:<!--avatar_visible-->;margin:<!--border-->px 0 0 <!--border-->px;background:#FFF url('<!--avatar_src-->') no-repeat center center;border:1px solid <!--avatar_border-->;"></div>
    <div id="lz_overlay_eyecatcher_avatar_bg" style="display:none;left:<!--border-->px;top:<!--border-->px;margin:3px 0 0 0;background:<!--avatar_border-->;height:<!--avatar_bg_height-->px;"></div>
    <div id="lz_ec_header_text" style="right:10px;left:<!--left_margin-->px;margin:0;padding:<!--header_padding-->px 0 0 <!--header_padding-->px;font-size:20px;z-index:10003;font-weight:bold;color:<!--header_color-->;"></div>
    <div id="lz_ec_sub_header_text" style="right:10px;line-height:15px;left:<!--left_margin-->px;margin:0;padding:<!--header_sub_padding-->px 0 0 <!--header_padding-->px;font-size:14px;opacity:0.95;z-index:10003;font-weight:normal;color:<!--header_color-->;overflow:hidden;"></div>
    <span id="lz_overlay_eyecatcher_close" style="z-index:10013;color:<!--header_color-->;" onclick="lz_tracking_remove_eye_catcher(event, this);">x</span>
    <canvas style="z-index:10001;" id="lz_overlay_eyecatcher_shadow" width="<!--width-->" height="<!--height-->"></canvas>
    <canvas style="z-index:10002;" id="lz_overlay_eyecatcher_bubble" width="<!--width-->" height="<!--height-->"></canvas>
    <canvas style="z-index:10003;" id="lz_overlay_eyecatcher_bubble" width="<!--width-->" height="<!--height-->"></canvas>
</div>