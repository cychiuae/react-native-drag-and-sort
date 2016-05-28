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
  LayoutAnimation,
  TouchableOpacity,
} from 'react-native';
const _ = require('lodash');

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
    flexWrap: 'wrap',
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

class DraggableView extends Component {

  constructor(...args) {
    super(...args);
    this.state = {
      pan: new Animated.ValueXY(),
      pop: new Animated.Value(0),
    };
  }

  _onLongPress = () => {
    const config = {
      tension: 40,
      friction: 3,
    };
    this.state.pan.addListener((value) => {
      this.props.onMove && this.props.onMove(value);
    });
    Animated.spring(this.state.pop, {
      toValue: 1,
      ...config,
    }).start();
    this.setState({
      panResponder: PanResponder.create({
        onPanResponderMove: (e, g) => {
          Animated.event([
          null,
          {
            dx: this.state.pan.x,
            dy: this.state.pan.y,
          }
        ])(e, g)},
        onPanResponderRelease: (e, gestureState) => {
          LayoutAnimation.easeInEaseOut();
          Animated.spring(this.state.pop, {
            toValue: 0,
            ...config,
          }).start();
          this.setState({
            panResponder: undefined,
          });
          this.props.onMove && this.props.onMove({
            x: gestureState.dx + this.props.restLayout.x,
            y: gestureState.dy + this.props.restLayout.y,
          });
          this.props.onDeactivate && this.props.onDeactivate();
        },
      }),
    }, () => {
      this.props.onActivate && this.props.onActivate();
    });
  };

  render = () => {
    let handlers;
    let dragStyle;
    if (!!this.state.panResponder) {
      handlers = this.state.panResponder.panHandlers;
      dragStyle = {
        position: 'absolute',
        ...this.state.pan.getLayout(),
      };
    } else {
      handlers = {
        onStartShouldSetResponder: () => true,
        onResponderGrant: () => {
          this.state.pan.setValue({x: 0, y: 0});           // reset                (step1: uncomment)
          this.state.pan.setOffset(this.props.restLayout); // offset from onLayout (step1: uncomment)
          this.longTimer = setTimeout(this._onLongPress, 300);
        },
        onResponderRelease: () => {
          if (!this.state.panResponder) {
            clearTimeout(this.longTimer);
          }
        }
      };
    }
    const animatedStyle = {
      transform: [
        {
          scale: this.state.pop.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.3],
          }),
        }
      ],
    };
    if (this.props.dummy) {
      animatedStyle.opacity = 0.2;
    }
    return (
      <Animated.View
        onLayout={this.props.onLayout}
        style={[
          {
            shadowRadius: 10,
            shadowColor: 'rgba(0,0,0,0.7)',
            shadowOffset: {height: 8},
            alignSelf: 'flex-start',
            backgroundColor: 'red',
            margin: 10,
          },
          dragStyle,
          animatedStyle,
        ]}
        {...handlers}
        >
        <View
          style={{
            width: ITEM_WIDTH,
            height: ITEM_WIDTH,
          }}>
          <Text>
            { this.props.item }
          </Text>
        </View>
      </Animated.View>
    );
  };

}

class DragReorderScrollView extends Component {

  constructor(...args) {
    super(...args);
    const itemsMap = [...this.props.items];
    this.state = {
      scrollEnabled: false,
      itemsMap,
      restLayouts: [],
      openVal: new Animated.Value(0),
    };
  }

  onScroll = () => {

  }

  render = () => {
    const items = this.state.itemsMap.map((item, key) => {
      if (item === this.state.activeItem) {
        return (
          <DraggableView
            key={item+'d'}
            dummy
            />
        );
      } else {
        let onLayout;
        if (!this.state.restLayouts[key]) {
          onLayout = (e) => {
            const layout = e.nativeEvent.layout;
            this.setState((state) => {
              state.restLayouts[key] = layout;
              return state;
            });
          };
        }
        return (
          <DraggableView
            key={item}
            item={item}
            onLayout={onLayout}
            restLayout={this.state.restLayouts[key]}
            onActivate={() => {
              this.setState({
                activeKey: key,
                activeItem: item,
                activeInitialLayout: this.state.restLayouts[key]
              })
            }}
            />
        );
      }
    });

    if (!!this.state.activeItem) {
      items.push(
         <DraggableView
           key={this.state.activeItem}
           item={this.state.activeItem}
           restLayout={this.state.activeInitialLayout}
           onMove={this._onMove}
           onDeactivate={() => { this.setState({activeKey: null, activeItem:null}); }}
         />
      );
    }

    return (
      <View style={styles.container}>
        <ScrollView
          ref={(sv) => (this.scrollview = sv)}
          style={styles.scrollview}
          horizontal={true}
          scrollEventThrottle={50}
          alwaysBounceHorizontal={false}
          scrollEnabled={false}
          onScroll={this.onScroll}
          >
          {
            items
          }
        </ScrollView>
      </View>
    );
  }

  _onMove = (position) => {
    const newItems = this.moveToClosest(position);
    if (!_.isEqual(newItems, this.state.itemsMap)) {
      LayoutAnimation.easeInEaseOut();  // animates layout update as one batch (step3: uncomment)
      console.log({
        newItems,
        old: this.state.itemsMap,
      })
      this.setState({itemsMap: newItems});
    }
  }

  moveToClosest = (position) => {
    let activeItem = null;
    let closestItem = null;
    let closestIndex = -1;
    let minDist = Infinity;
    const newItems = [];
    this.state.itemsMap.forEach((item, key) => {
      const dist = this.distance(position, this.state.restLayouts[key]);

      if (item !== this.state.activeItem) {
        newItems.push(item);
      }

      if (dist < minDist) {
        minDist = dist;
        closestItem = item;
        closestIndex = key;
      }
    });
    if (closestItem === activeItem) {
      return this.state.itemsMap;
    }
    newItems.splice(closestIndex, 0, this.state.activeItem);
    return newItems;
  }

  distance = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
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

