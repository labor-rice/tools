<template>
	<view class="wrap">
		<view class="content">
			<view class="user">
				<view class="base-info">
					<view class="user-info">
						<view class="avatar" @click="changeAvator">
							<image
								class="avatar-img"
								:src="user.avatar"
								@error="imageError"
							/>
							<uni-icons
								class="edit-avatar"
								type="camera-filled"
								size="38rpx"
							></uni-icons>
						</view>
						<view class="info" @click="changeName">
							<u-text
								suffixIcon="edit-pen"
								:iconStyle="iconStyle"
								:text="user.nickname"
								size="36rpx"
								color="#fff"
								align="center"
								lines="1"
							>
							</u-text>
						</view>
					</view>
				</view>
			</view>
		</view>
		<pageLoading v-if="showPageLoading"></pageLoading>
		<u-modal
			:show="model.isShow"
			:title="model.title"
			:showCancelButton="true"
			@cancel="cancel"
			@confirm="confirm"
		>
			<view class="slot-content">
				<uni-easyinput
					trim="both"
					v-model="model.text"
					maxlength="16"
					placeholder="请输入昵称"
					@input="nameError = false"
					:styles="styles"
					clearable="true"
				></uni-easyinput>
				<text :class="['name-tips', nameError ? 'name-error' : '']"
					>昵称长度为2-16个字符</text
				>
			</view>
		</u-modal>
		<u-action-sheet
			:round="8"
			:actions="sheet.list"
			:show="sheet.isShow"
			cancelText="取消"
			@select="changeAvatar"
			@close="sheet.isShow = false"
			:closeOnClickOverlay="true"
		>
		</u-action-sheet>
		<u-toast ref="uToast"></u-toast>
	</view>
</template>

<script>
import pageLoading from "@/common/components/loading/pageLoading.vue";
import { getStore, setStore } from "@/elcker/build/utils/storage";
import RepairApi from "@/repair/api/repair/index.js";
import globalConfig from "@/elcker/build/config/index.js";

const file_base_path = globalConfig.VUE_APP_MINIO_URL + globalConfig.VUE_APP_VATE_SERVICE_PATH;
const name_validator = (name) => {
	const reg = /^[\S][\s\S]{0,14}[\S]$/;
	return reg.test(name);
};
export default {
	components: {
		pageLoading
	},
	data() {
		return {
			user: {
				id: "",
				avatar: "",
				nickname: "点击登录"
			},
			loginText: "登录",
			showPageLoading: false,
			sheet: {
				list: [
					{
						index: 1,
						name: "拍照",
					},
					{
						index: 2,
						name: "从手机相册选择",
					},
					{
						index: 3,
						name: "保存图片",
					},
				],
				isShow: false
			},
			model: {
				isShow: false,
				title: "",
				text: ""
			},
			nameError: false
		};
	},
	computed: {
		styles() {
			let borderColor = "#DCDFE6";
			if (this.nameError) {
				borderColor = "#ED4040";
			}
			return {
				borderColor
			};
		}
	},
	onShow() {
		uni.hideHomeButton()
		// #ifdef MP
		this.loginText = "微信登录";
		// #endif
		this.getUserInfo(); //获取用户信息
	},
	onPullDownRefresh() {
		this.getUserInfo(); //获取用户信息
	},
	methods: {
		changeAvator() {
			if (!this.user.id) {
				this.login()
			} else {
				this.sheet.isShow = true;
			}
		},
		imageError() {
			this.user.avatar = require("@/common/images/user/default.png");
		},
		/*获取用户信息*/
		getUserInfo() {
			this.user.id = getStore({ name: "userInfo" })?.user_id ?? "";
			if (!this.user.id) {
				// 授权登录
				return;
			}
			this.showPageLoading = true;
			// 调接口，获取用户信息，回显
			UserApi.getWxInfo({id: this.user.id }).then((res) => {
				if (res.code === 200) {
					this.showPageLoading = false;
					this.user.avatar = file_base_path + res.data.avatar;
					this.user.nickname = res.data.nickname;
					const ava = getStore({
						name: "userInfo",
					});
					ava.avatar = this.user.avatar;
					setStore({
						name: "userInfo",
						content: ava,
					});
				}
				else {
					this.errorTips(res.msg);
				}
			});
		},
		/*登录*/
		login() {
			uni.login({
				provider: 'weixin',
				success: wxcode => {
					// 1. 登录系统
					// 2. 获取用户信息
					this.getUserInfo();
				}
			})
		},
		changeAvatar(e) {
			switch (e.index) {
				case 1:
					this.chooseImg("camera");
					break;
				case 2:
					this.chooseImg("album");
					break;
				case 3:
					this.downloadImg();
					break;
				default:
					this.sheet.isShow = false;
			}
		},
		chooseImg(type) {
			uni.chooseMedia({
				count: 1, //默认9
				sizeType: ["original", "compressed"], //可以指定是原图还是压缩图，默认二者都有
				sourceType: [type],
				mediaType: ["image"],
				success: (res) => {
					let sendData = {
						name: "file",
						filePath: res.tempFiles[0].tempFilePath,
						url: "/upload",
					};
					RepairApi.upload(sendData).then((r) => {
						r = JSON.parse(r);
						if (r.code == 200) {
							this.saveInfo(
								{
									id: this.user.id,
									avatar: r.data
								},
								"修改头像"
							);
						}
					}).catch((err) => {
						this.errorTips('上传头像失败，请稍后重试')
					});
				}
			});
		},
		downloadImg() {
			uni.downloadFile({
				url: this.user.avatar,
				success: (data) => {
					if (data.statusCode === 200) {
						uni.saveImageToPhotosAlbum({
							filePath: data.tempFilePath,
							success: () => {
								this.succTips('保存成功')
							},
							fail: (res) => {
								this.errorTips('保存失败')
							},
							complete: function () {
								//隐藏提示
								uni.hideLoading();
							},
						});
					}
				},
				fail: (err) => {
					this.errorTips('保存失败')
				},
			});
		},
		saveInfo(params, tips) {
			let options = {
				data: params
			};
			UserApi.updateInfo(options)
				.then((res) => {
					if (res.code === 200) {
						this.succTips(tips);
						this.setInfo(res.data);
						this.model.isShow = false;
						return;
					}
					this.errorTips(tips);
				})
				.catch((err) => {
					this.errorTips(err);
				});
		},
		setInfo(info) {
			this.user.avatar = file_base_path + info.avatar;
			const ava = getStore({
				name: "userInfo",
			});
			ava.avatar = info.avatar;
			setStore({
				name: "userInfo",
				content: ava
			});
			this.user.nickname = info.nickname;
		},
		succTips(tips) {
			this.$refs.uToast.show({
				type: "success",
				message: `${tips}成功`
			});
		},
		errorTips(tips) {
			this.$refs.uToast.show({
				message: `${tips}失败`
			});
		},
		changeName() {
			if (!this.user.id) {
				this.login()
			} else {
				this.model.title = "修改昵称";
				this.model.text = this.user.nickname;
				this.model.isShow = true;
			}
		},
		confirm() {
			// 昵称校验
			const isValidated = name_validator(this.model.text);
			if (!isValidated) {
				this.nameError = true;
				return;
			}
			// 调接口，保存昵称
			this.saveInfo(
				{
					id: this.user.id,
					nickname: this.model.text
				},
				"修改昵称"
			);
		},
		cancel() {
			this.model.isShow = false;
		}
	}
};
</script>

<style scoped lang="scss">
.user {
	.base-info {
		background: #007aff;
	}

	.user-info {
		padding: 60rpx 32rpx 64rpx;
		display: flex;
		align-items: center;
		justify-content: flex-start;

		.avatar {
			flex-grow: 0;
			flex-shrink: 0;
			line-height: 0;
			border-radius: 50%;
			position: relative;

			image {
				width: 144rpx;
				height: 144rpx;
				border-radius: 50%;
				border: 1rpx solid #fff;
			}

			.edit-avatar {
				position: absolute;
				right: 9rpx;
				bottom: 21rpx;
			}
		}

		.info {
			line-height: 158rpx;
			padding-left: 36rpx;

			.nickname {
				font-size: 44rpx;
				color: #ffffff;
				margin-top: -14rpx;
			}
		}
	}
}

.name-tips {
	font-size: 24rpx;
	color: #848484;
	padding: 16rpx 0 0 6rpx;
}

.input-error {
	border-color: $color-red;
}

.name-error {
	color: $color-red;
}
</style>
