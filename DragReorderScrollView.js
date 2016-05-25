import React, {
  Component,
  PropTypes,
} from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  Text,
  PanResponder,
} from 'react-native';

const deviceWidth = Dimensions.get('window').width;
const ITEM_WIDTH = deviceWidth / 4 - 16;
const ITEM_WRAPPER_PADDING = 5;

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

const INTERVAL = 15;
const THRESHOLD = 100;

class DragReorderScrollView extends Component {

  constructor(...args) {
    super(...args);

    this.state = {
      items: [
        ...this.props.items,
      ],
      pan: new Animated.ValueXY(),
      scrollEnabled: true,
      contentOffsetX: 0,
      currentItemIndex: -1,
      timer: 0,
      shouldMove: false,
      currentItemLeftPan: new Animated.Value(0),
      currentItemRightPan: new Animated.Value(0),
      itemWrapperPadding: this.props.itemWrapperPadding || ITEM_WRAPPER_PADDING,
    };
  }

  propTypes = {
    items: PropTypes.array.isRequired,
    renderItem: PropTypes.func.isRequired,
    placeholderItemStyle: PropTypes.object,
    activeItemStyle: PropTypes.object,
    didFinishReorder: PropTypes.func,
    itemWrapperPadding: PropTypes
  }

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
        (this.state.contentOffsetX + evt.nativeEvent.pageX) / ((this.state.itemWrapperPadding * 2) + ITEM_WIDTH)
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
        // if ((gesture.moveX < 16 + (this.state.itemWrapperPadding * 2) + ITEM_WIDTH) ) {
        //   this.scrollview.scrollTo({
        //     x: this.state.contentOffsetX - 60,
        //     animated: true,
        //   });
        // } else if ((gesture.moveX > deviceWidth - 16 - (this.state.itemWrapperPadding * 2) - ITEM_WIDTH)) {
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
        currentItemLeftPan: new Animated.Value(0),
        currentItemRightPan: new Animated.Value(0),
      }, this._didFinishReorder);
    },
  });

  clearInterval = () => {
    clearInterval(this.timerId);
  }

  reorder = (pageX) => {
    const currentItemIndex = this.state.currentItemIndex;
    const item = this.state.items[currentItemIndex];
    const newIndex = Math.floor(
      (this.state.contentOffsetX + pageX) / ((this.state.itemWrapperPadding * 2) + ITEM_WIDTH)
    );
    if (currentItemIndex !== newIndex && !!item) {
      const itemsCopy = [
        ...this.state.items
      ];
      itemsCopy.splice(currentItemIndex, 1);
      itemsCopy.splice(newIndex, 0, item);
      console.log('photo copy', itemsCopy);
      this.setState({
        items: itemsCopy,
        currentItemIndex: newIndex,
      });
    }
  };

  _didFinishReorder = () => {
    this.props.didFinishReorder &&
    this.props.didFinishReorder(this.state.items);
  };

  tick = () => {
    if (this.state.timer > THRESHOLD) {
      this.clearInterval();
      this.setState({
        shouldMove: true,
        scrollEnabled: false,
        activeItemLeft: this.state.currentItemIndex * (ITEM_WIDTH + (this.state.itemWrapperPadding * 2)),
      });
    } else {
      const timer = this.state.timer + INTERVAL;
      this.setState({
        timer,
      });
    }
  };

  onScroll = (evt) => {
    this.setState({
      contentOffsetX: evt.nativeEvent.contentOffset.x,
    });
  }

  renderItems() {
    const items = [];
    for (let i = 0; i < this.state.items.length; i++) {
      const animationRelatedStyle = this._getAnimationRelatedStyle(i);
      const item = this.state.items[i];
      items.push(
        <Animated.View
          style={animationRelatedStyle}
          >
          <View style={{
            padding: this.state.itemWrapperPadding,
          }}>
            {this.props.renderItem(i, item)}
          </View>
        </Animated.View>
      );
    }
    return items;
  }

  renderActiveItem() {
    const {
      currentItemIndex,
      shouldMove,
      items,
    } = this.state;
    if (currentItemIndex !== -1 && shouldMove) {
      return (
        <Animated.View
          style={[
            this.state.pan.getLayout(),
            this.props.activeItemStyle || styles.ghost,
            ]} >
          <View style={{
            padding: this.state.itemWrapperPadding,
          }}>
            {this.props.renderItem(currentItemIndex, items[currentItemIndex])}
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

  _getAnimationRelatedStyle(indexOfItemRendering) {
    const {
      currentItemIndex,
      shouldMove,
    } = this.state;
    let animationRelatedStyle = {};
    if (indexOfItemRendering === currentItemIndex && shouldMove) {
      animationRelatedStyle = this.props.placeholderItemStyle || styles.itemHidden;
    } else if (indexOfItemRendering === currentItemIndex + 1 && shouldMove) {
      animationRelatedStyle = {
        transform: [
          {
            translateX: this.state.currentItemRightPan,
          }
        ],
      };
    } else if (indexOfItemRendering === currentItemIndex - 1 && shouldMove) {
      animationRelatedStyle = {
        transform: [
          {
            translateX: this.state.currentItemLeftPan,
          }
        ],
      };
    }
    return animationRelatedStyle;
  }

}

module.exports = DragReorderScrollView;

