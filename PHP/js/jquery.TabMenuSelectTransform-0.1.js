/**___________________________________________________________________________________
@author WolfHaru/2012
@link http://wolfharu.tistory.com
@version 0.1
___________________________________________________________________________________**/

$.fn.TabMenuSelectTransform = function() {
	$(this).each(function() {
		var $TMSTBox = $(this);
		var $TMSTMenu = $TMSTBox.find('>.wolfharu_tabmenu_menu');
		var $TMSTMenuUI = $TMSTMenu.find('>ul:eq(0)');
		var $TMSTMenuLink = $TMSTMenuUI.find('>li>a');
		var $TMSTCont = $TMSTBox.find('.wolfharu_tabmenu_content_item');
		
		$TMSTCont.hide().eq(0).show();
		$TMSTMenuLink.eq(0).addClass('current');
		
		$TMSTMenuUI.before('<select></select>').find('li').each(function() {
			var $TMSTMenuLi = $(this);
			var TMSTMenuLiText = $TMSTMenuLi.find('a:eq(0)').text();
			var TMSTMenuLiHref = $TMSTMenuLi.find('a:eq(0)').attr('href');
			if ( $TMSTMenuLi.find('a:eq(0)').hasClass('current') ) {
				$TMSTMenu.find('select:eq(0)').append('<option value="'+TMSTMenuLiHref+'" selected="selected">'+TMSTMenuLiText+'</option>');
			} else {
				$TMSTMenu.find('select:eq(0)').append('<option value="'+TMSTMenuLiHref+'">'+TMSTMenuLiText+'</option>');
			}
		});
		
		$TMSTMenuLink.each(function(index) {
			$(this).click(function() {
				$TMSTCont.hide();
				$TMSTMenuLink.removeClass('current');
				$($(this).attr('href')).show();
				$(this).addClass('current');
				$TMSTMenu.find('select:eq(0)').find('option').eq(index).attr('selected','selected');
			});
		});
		
		$TMSTMenu.find('select:eq(0)').bind('change',function() {
			$TMSTCont.hide();
			$(this).find('option').each(function(index) {
				$(this).filter(':selected').each(function() {
					$($(this).attr('value')).show();
					$TMSTMenuLink.removeClass('current').eq(index).addClass('current');
				});
			});
		});
	});
	return this;
}