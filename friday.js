import React, {
  Component,
} from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  Text,
  PanResponder,
  LayoutAnimation,
  InteractionManager,
} from 'react-native';

const deviceWidth = Dimensions.get('window').width;
const ITEM_WIDTH = deviceWidth / 4 - 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ededed',
    padding: 16
  },
  scrollview: {
    flexDirection: 'row',
    overflow: 'visible',
    marginTop: 20,
    height: 100,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#123456',
  },
  itemWrapper: {
    padding: 5,
  },
  text: {
    color: 'white',
  },
  ghost: {
    opacity: 0.3,
    transform: [
      {
        scale: 1.2,
      },
    ]
  },
  itemHidden: {
    opacity: 0.0,
  }
});

const PHOTOS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
];

class Item extends Component {

  constructor(...args) {
    super(...args);
  }

  render() {
    return (
      <View ref="view" style={styles.item}>
        {
          this.props.children
        }
      </View>
    );
  }

}

const INTERVAL = 15;
const THRESHOLD = 100;

class Friday extends Component {

  scrollview = null;
  currentPanValue = {
    x: 0,
    y: 0,
  };
  timerId: null;
  panResponder = PanResponder.create({
    onMoveShouldSetResponderCapture: () => this.state.shouldMove,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (evt, gesture) => {
      const currentItemIndex = Math.floor(
        (this.state.contentOffsetX + evt.nativeEvent.pageX) / (10 + ITEM_WIDTH)
      );
      this.state.pan.setOffset(this.currentPanValue);
      this.state.pan.setValue(this.currentPanValue);
      this.setState({
        currentItemIndex,
      });
      this.timerId = setInterval(this.tick, INTERVAL);
    },
    onPanResponderMove: (evt, gesture) => {
      if (this.state.shouldMove) {
        if (Math.abs(gesture.vx) < 1.0) {
          this.reorder(evt.nativeEvent.pageX);
        }
        Animated.event([null, {
            dx: this.state.pan.x,
            dy: this.state.pan.y,
        }])(evt, gesture);
        // if ((gesture.moveX < 16 + 10 + ITEM_WIDTH) ) {
        //   this.scrollview.scrollTo({
        //     x: this.state.contentOffsetX - 60,
        //     animated: true,
        //   });
        // } else if ((gesture.moveX > deviceWidth - 16 - 10 - ITEM_WIDTH)) {
        //   this.scrollview.scrollTo({
        //     x: this.state.contentOffsetX + 60,
        //     animated: true,
        //   });
        // }
      }
    },
    onPanResponderRelease: () => {
      console.log('release');
      this.clearInterval();
      this.setState({
        currentItemIndex: -1,
        timer: 0,
        scrollEnabled: true,
        shouldMove: false,
      });
    },
    onPanResponderTerminate: () => {
      console.log('terminate');
      this.clearInterval();
      this.setState({
        currentItemIndex: -1,
        timer: 0,
        scrollEnabled: true,
        shouldMove: false,
        currentItemLeftPan: new Animated.Value(0),
        currentItemRightPan: new Animated.Value(0),
      });
    }
  });

  clearInterval = () => {
    clearInterval(this.timerId);
  }

  reorder = (pageX) => {
    const currentItemIndex = this.state.currentItemIndex;
    const item = this.state.photos[currentItemIndex];
    const newIndex = Math.floor(
      (this.state.contentOffsetX + pageX) / (10 + ITEM_WIDTH)
    );
    if (currentItemIndex !== newIndex && !!item) {
      const photosCopy = [
        ...this.state.photos
      ];
      photosCopy.splice(currentItemIndex, 1);
      photosCopy.splice(newIndex, 0, item);
      console.log('photo copy', photosCopy);
      this.setState({
        photos: photosCopy,
        currentItemIndex: newIndex,
      });
    }
  };

  tick = () => {
    if (this.state.timer > THRESHOLD) {
      this.clearInterval();
      this.setState({
        shouldMove: true,
        scrollEnabled: false,
        activeItemLeft: this.state.currentItemIndex * (ITEM_WIDTH + 10),
      });
    } else {
      const timer = this.state.timer + INTERVAL;
      this.setState({
        timer,
      });
    }
  };

  constructor(...args) {
    super(...args);

    this.state = {
      photos: [
        ...PHOTOS,
      ],
      pan: new Animated.ValueXY(),
      scrollEnabled: true,
      contentOffsetX: 0,
      currentItemIndex: -1,
      timer: 0,
      shouldMove: false,
      currentItemLeftPan: new Animated.Value(0),
      currentItemRightPan: new Animated.Value(0),
    };
  }

  onScroll = (evt) => {
    this.setState({
      contentOffsetX: evt.nativeEvent.contentOffset.x,
    });
  }

  renderItems() {
    const items = [];
    for (let i = 0; i < this.state.photos.length; i++) {
      if (i === this.state.currentItemIndex && this.state.shouldMove) {
        items.push(
          <Animated.View
             >
            <View style={[styles.itemWrapper, styles.itemHidden]}>
              <Item>
                <Text style={styles.text}>
                  {
                    this.state.photos[i]
                  }
                </Text>
              </Item>
            </View>
          </Animated.View>
        );
      } else if (i === this.state.currentItemIndex + 1 &&
                 this.state.shouldMove) {
        items.push(
          <Animated.View
            style={{
              transform: [
                {
                  translateX: this.state.currentItemRightPan,
                }
              ],
            }}
             >
            <View style={styles.itemWrapper}>
              <Item>
                <Text style={styles.text}>
                  {
                    this.state.photos[i]
                  }
                </Text>
              </Item>
            </View>
          </Animated.View>
        );

      } else if (i === this.state.currentItemIndex - 1 &&
                 this.state.shouldMove) {
        items.push(
          <Animated.View
            style={{
              transform: [
                {
                  translateX: this.state.currentItemLeftPan,
                }
              ],
            }} >
            <View style={styles.itemWrapper}>
              <Item>
                <Text style={styles.text}>
                  {
                    this.state.photos[i]
                  }
                </Text>
              </Item>
            </View>
          </Animated.View>
        );

      } else {
        items.push(
          <Animated.View
             >
            <View style={styles.itemWrapper}>
              <Item>
                <Text style={styles.text}>
                  {
                    this.state.photos[i]
                  }
                </Text>
              </Item>
            </View>
          </Animated.View>
        );
      }
    }
    return items;
  }

  renderActiveItem() {
    if (this.state.currentItemIndex !== -1 && this.state.shouldMove) {
      return (
        <Animated.View
          style={this.state.pan.getLayout()} >
          <View style={[styles.itemWrapper, styles.ghost]}>
            <Item>
              <Text style={styles.text}>
                {
                  this.state.photos[this.state.currentItemIndex]
                }
              </Text>
            </Item>
          </View>
        </Animated.View>
      );
    }
    return null;
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={(sv) => (this.scrollview = sv)}
          style={styles.scrollview}
          horizontal={true}
          scrollEventThrottle={50}
          alwaysBounceHorizontal={false}
          scrollEnabled={this.state.scrollEnabled}
          onScroll={this.onScroll}
          {...this.panResponder.panHandlers}
          >
          <View style={{flexDirection: 'row'}}>
            {
              this.renderItems()
            }
            <View style={{
                position: 'absolute',
                left: this.state.activeItemLeft,
              }}>
               {
                 this.renderActiveItem()
               }
             </View>
          </View>
        </ScrollView>

      </View>
    );
  }

}

module.exports = Friday;

