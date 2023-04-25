<template>
	<view class="container">
		<view class="content">
			<view class="content-fileTitle" v-if="fileList.length">附件列表</view>
			<uni-card class="item-fileCard" v-for="(item, index) in fileList" @click="download(item.fileUrl, item.fileName)"
				:key="index">
				<view :class="['vate', 'vate-' + fileType(item.fileName), 'file-icon']" aria-hidden="true">
				</view>
				<text class="file-name">{{ item.fileName }}</text>
				<uni-icons class="file-download" type="download" size="20"></uni-icons>
			</uni-card>
		</view>
		<u-popup :show="downLoad.showModal" :round="10" mode="center" @close="closeModal">
			<view class="popup-content">
				<text>文件正在下载中......</text>
				<u-line-progress :percentage="downLoad.percentage" activeColor="#49a5fc"></u-line-progress>
			</view>
		</u-popup>
		<pageLoading v-if="showPageLoading"></pageLoading>
	</view>
</template>

<script>
	import IndexApi from "@/elcker/api/article/index.js";
	import pageLoading from "./components/loading/pageLoading.vue";

	const file_types = [{
			suffix: [
				"jpg",
				"jpeg",
				"bmp",
				"png",
				"psd",
				"svg",
				"fpx",
				"tga",
				"gif",
				"tiff",
			],
			icon: "wenjianleixing-biaozhuntu-tupianwenjian",
		},
		{
			suffix: ["txt"],
			icon: "wenjianleixing-biaozhuntu-jishiben",
		},
		{
			suffix: ["ppt"],
			icon: "wenjianleixing-biaozhuntu-huandengpian",
		},
		{
			suffix: ["mp3", "aiff", "wma", "rm", "wav", "mid", "ape", "flac"],
			icon: "wenjianleixing-biaozhuntu-shengyinwenjian",
		},
		{
			suffix: [
				"mpg",
				"mpeg",
				"avi",
				"rm",
				"rmvb",
				"mov",
				"wmv",
				"asf",
				"dat",
				"asx",
				"wvx",
				"mpe",
				"mpa",
				"mp4",
			],
			icon: "wenjianleixing-biaozhuntu-shipinwenjian",
		},
		{
			suffix: ["zip", "rar", "aej", "cab"],
			icon: "wenjianleixing-biaozhuntu-yasuowenjian",
		},
		{
			suffix: ["pdf"],
			icon: "wenjianleixing-biaozhuntu-PDFwendang",
		},
		{
			suffix: ["doc", "docx"],
			icon: "wenjianleixing-biaozhuntu-Wordwendang",
		},
		{
			suffix: ["xsl", "xlsx"],
			icon: "wenjianleixing-biaozhuntu-Wordwendang",
		},
		// 未知：'wenjianleixing-biaozhuntu-weizhiwenjian'
	];
	export default {
		components: {
			pageLoading
		},
		data() {
			return {
				showPageLoading: true,
				downLoad: {
					percentage: 0,
					task: null,
					showModal: false
				}
			};
		},
		computed: {
			fileList() {
				return this.detail?.articleFiles ?? [];
			}
		},
		onLoad(options) {
			if (options.i) {
				this.articleId = options.i;
				// H5文章详情
				this.getDetail();
			}
		},
		onHide() {
			// 终止下载
			this.downLoad.task ? this.downLoad.task.abort() : '';
		},
		methods: { // 文章详情
			getDetail() {
				const data = {
					params: {
						articleId: this.articleId
					}
				};
				IndexApi.getDetail(data).then((res) => {
						if (res.code == 200) {
							this.detail = res.data;
						}
					})
					.catch((err) => {
						this.showPageLoading = false;
					});
			},
			// 匹配附件类型
			fileType(a) {
				const nameArr = a.split(".");
				const type = nameArr[nameArr.length - 1].toLowerCase();
				const res = file_types.filter((item) => {
					return item.suffix.indexOf(type) !== -1;
				});
				if (res.length) {
					return res[0].icon;
				}
				return "wenjianleixing-biaozhuntu-weizhiwenjian";
			},
			// 附件下载
			download(url, fileName) {
				// #ifdef MP-WEIXIN
				this.downLoad.task = uni.downloadFile({
					url,
					success: (res) => {
						if (res.statusCode === 200) {
							this.saveFile(res.tempFilePath, fileName);
						}
					}
				});
				this.downLoad.showModal = true;
				// 监听进度
				this.downLoad.task.onProgressUpdate((res) => {
					this.downLoad.percentage = res.progress;
				});
				// #endif
				// #ifdef H5
				// 判断是否H5微信环境
				if (this.isWxBrowser()) {
					this.$refs.popup.open();
					return;
				}
				let a = document.createElement("a");
				a.href = url;
				a.download = fileName; //下载后文件名
				document.body.appendChild(a);
				a.click(); //点击下载
				document.body.removeChild(a); //下载完成移除元素
				// #endif
			},
			saveFile(tempFilePath, name) {
				uni.saveFile({
					tempFilePath,
					success: (red) => {
						this.downLoad.showModal = false;
						uni.showModal({
							title: '提示',
							content: '文件已下载完成',
							cancelText: '我知道了',
							confirmText: '打开文件',
							success: (res) => {
								if (res.confirm) {
									const arr = name.split(".");
									const fileType = arr[arr.length - 1].toLowerCase();
									uni.openDocument({
										filePath: red.savedFilePath,
										showMenu: true,
										// 可用 doc, xls, ppt, pdf, docx, xlsx, pptx
										fileType,
										success: () => {}
									})
								}
							}
						});
					},
					fail: (err) => {
						uni.$u.toast('下载失败' + err);
					}
				});
			},
			closeModal() {
				// 终止下载
				this.downLoad.task.abort();
			},
			isWxBrowser() {
				// 判断是否H5微信环境，true为微信浏览器
				const ua = navigator.userAgent.toLowerCase();
				return ua.match(/MicroMessenger/i) == "micromessenger" ? true : false;
			},
			saveImageToPhotosAlbum() {
				let base64 = this.qrcode.replace(/^data:image\/\w+;base64,/, ""); //去掉data:image/png;base64,
				let filePath = wx.env.USER_DATA_PATH + '/hym_pay_qrcode.png';
				uni.getFileSystemManager().writeFile({
					filePath: filePath, //创建一个临时文件名
					data: base64, //写入的文本或二进制数据
					encoding: 'base64', //写入当前文件的字符编码
					success: res => {
						uni.saveImageToPhotosAlbum({
							filePath: filePath,
							success: function(res2) {
								uni.showToast({
									title: '保存成功，请从相册选择再分享',
									icon: "none",
									duration: 5000
								})
							},
							fail: function(err) {
								// console.log(err.errMsg);
							}
						})
					},
					fail: err => {
						//console.log(err)
					}
				})
			}
		}
	};
</script>

<style lang="scss" scoped>
	@import "./static/fileIcon/index.css";

	.content {
		padding: 20px;
		background: $color-white;
		font-family: 'system-ui,-apple-system,BlinkMacSystemFont,Helvetica Neue,PingFang SC,Hiragino Sans GB,Microsoft YaHei UI,Microsoft YaHei,Arial,sans-serif';

		&-fileTitle {
			margin: 40rpx 0 20rpx;
			padding-left: 26rpx;
			position: relative;

			&:before {
				position: absolute;
				content: "";
				width: 10rpx;
				height: 36rpx;
				top: 4rpx;
				left: 0;
				border-radius: 10rpx;
				background: #3399ff;
				z-index: 0;
			}
		}

		.item-fileCard {
			margin-bottom: 30rpx;
		}

		.item-fileCard:last-child {
			margin-bottom: 0;
		}

		/deep/ .uni-card {

			.file-icon {
				width: 60rpx;
				height: 60rpx;
				fill: currentColor;
				overflow: hidden;
				margin: 10rpx 20rpx 0 0;
				vertical-align: top;
			}

			.file-name {
				font-size: 32rpx;
				color: #3a3a3a;
				line-height: 80rpx;
				display: inline-block;
				width: 70%;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}

			.file-download {
				float: right;
				line-height: 38px;
			}
		}
	}

	.popup-content {
		padding: 40rpx 50rpx;
		font-size: 28rpx;
		line-height: 72rpx;
	}
</style>
