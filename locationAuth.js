/* 微信小程序，获取当前位置及后续操作 */
onLoad() {
  // 判断是否允许授权位置信息
  this.auth()
},
methods: {
  auth() {
    // 1、判断手机定位服务【GPS】 是否授权
    uni.getSystemInfo({
      success: (res) => {
        const { locationEnabled, locationAuthorized } = res
        // 判断手机定位服务是否开启 || 定位服务是否允许微信授权
        if (locationEnabled == false || locationAuthorized == false) {
          this.locatToTY();
        } else {
          // 2、判断微信小程序是否授权位置信息
          uni.authorize({
            //授权请求窗口
            scope: "scope.userLocation", //授权的类型
            success: (res) => {
              this.getLocation();
            },
            fail: (err) => {
              err = err["errMsg"];
              uni.showModal({
                  content: "需要授权位置信息",
                  confirmText: "确认授权",
                })
                .then((res) => {
                  if (res[1]["confirm"]) {
                    uni.openSetting({
                      success: (res) => {
                        // 授权成功
                        if (res.authSetting["scope.userLocation"]) {
                          uni.showToast({
                            title: "授权成功",
                            icon: "none",
                          });
                          this.getLocation();
                        } else {
                          uni.showModal({
                            title: "授权",
                            content: "获取授权" + authouName + "失败,是否前往授权设置？",
                            success: function(result) {
                              if (result.confirm) {
                                uni.openSetting();
                              }
                            },
                            fail: function() {
                              this.locatToTY();
                            }
                          });
                        }
                      }
                    });
                  }
                  if (res[1]["cancel"]) {
                    this.locatToTY();
                  }
                });
            }
          });
        }
      }
    })
  },
  getLocation() {
    // 获取手机的位置
    uni.getLocation({
      type: 'gcj02',
      success: res => {
        let positionLocation1 = [res.latitude, res.longitude]
        this.latitude = res.latitude;
        this.longitude = res.longitude
        let data = {
          location: positionLocation1.join(','),  // 经纬度
          key: Base64.decode(globalConfig.ak)     // 地图ak
        }
        this.getLocationCode(data)
      },
      fail: err => {
        this.locatToTY()
      },
    })
  },
  // 取消授权，默认定位到太原
  locatToTY() {
    uni.showToast({
      title: '获取位置失败,默认显示太原市的位置信息',
      icon: 'none',
      duration: 3000
    })
    this.positiones = '140100'
    this.getOrg()
  },
  getLocationCode(data) {
    MapApi.getLocation(data).then(res => {
      let { addressComponent } = res.result
      // 获取到行政区域编码
      if (addressComponent.adcode) {
        this.positiones = addressComponent.adcode
        this.getOrg()
      } else {
        this.locatToTY()
      }
    })
    .catch(() => {})
  }
}

/* Api */
getLocation(data) {
  return uniHttp.get('https://api.map.baidu.com/reverse_geocoding/v3/?ak=' + data.key + '&output=json&coordtype=wgs84ll&location=' + data.location)
}
