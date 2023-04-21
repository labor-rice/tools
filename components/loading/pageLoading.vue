<template>
	<view class="global-loading-container global-loading-mask">
		<view class="global-loading-wrapper">
			<view class="global-loading"></view>
		</view>
	</view>
</template>
<script>
	export default { name: 'pageLoading' }
</script>
<style lang="scss">
	.global-loading-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, .5);
	}

	.global-loading-container.global-loading-mask {
		background: #fff;
	}

	.global-loading-wrapper {
		position: relative;
		height: 100%;
		width: 100%;
	}

	.global-loading {
		position: absolute;
		top: 45%;
		left: 50%;
		height: 135rpx;
		width: 135rpx;
		transform: translate(-50%, -50%);
	}

	.global-loading:before,
	.global-loading:after {
		content: '';
		display: inline-block;
		position: absolute;
		top: 0;
		left: 0;
		height: 135rpx;
		width: 135rpx;
		box-sizing: border-box;
	}

	@-webkit-keyframes globalLoadingRotate {
		from {
			transform: rotate(0);
		}

		to {
			transform: rotate(360deg);
		}
	}

	@keyframes globalLoadingRotate {
		from {
			transform: rotate(0);
		}

		to {
			transform: rotate(360deg);
		}
	}

	.global-loading:before {
		border: 4rpx solid #f7f7f7;
		border-right-color: #39f;
		border-radius: 100%;
		animation: globalLoadingRotate linear 1.5s infinite;
	}

	.global-loading:after {
		background-image: url(@/common/images/article/loading.png);
		background-size: 100rpx;
		background-repeat: no-repeat;
		background-position:center;		
	}
</style>
