import wx from 'weixin-js-sdk'  // 1.2.0

function imgPreview() {
	let imgObj = document.getElementsByTagName('img')
	let urlArr = []
	imgObj.forEach(el => {
		// 微信端，文章内容图片预览
		if (el.className === 'raw-image') {
			const { currentSrc } = el
			urlArr.push(currentSrc)
			el.onclick = function() {
				wx.previewImage({
					current: currentSrc,
					urls: urlArr
				})
			}
		}
	})
}

export default imgPreview




// 页面渲染完成后，调用
// this.$nextTick(() => {
//  imgPreview()
// });
