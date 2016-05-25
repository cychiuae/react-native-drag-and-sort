/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from 'react-native';


const deviceWidth = Dimensions.get('window').width;
const photoWidth = deviceWidth / 4 - 16;

class Dragable extends Component {

  constructor(...args) {
    super(...args);
    this.state = {
      pan: new Animated.ValueXY(),
    };
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([
        null, {
          dx: this.state.pan.x,
          dy: this.state.pan.y,
        }
      ]),
      onPanResponderRelease: (e, gesture) => {
        Animated.spring(
          this.state.pan,
          {
            toValue:{
              x: 0,
              y: 0,
            }
          }
        ).start();
      }
    });
  }

  onLongPress() {

  }

  render() {
    return (
      <Animated.View
        {...this.panResponder.panHandlers}
        style={[
          this.state.pan.getLayout(),
          this.props.style,
        ]}>
        {
          this.props.children
        }
      </Animated.View>
    );
  }

}
/*
class Item extends Component {

  shouldComponentUpdate(nextProps) {
    if (this.props.hovering !== nextProps.hovering) {
      return true;
    }
    if (this.props.active !== nextProps.active) {
      return true;
    }
    if (this.props.item.data !== nextProps.item.data) {
      return true;
    }
    return false;
  }

  handleLongPress(e) {
    this.refs.view.measure(
      (frameX, frameY, frameWidth, frameHeight, pageX, pageY) => {
        const layout = {
          frameX,
          frameY,
          frameWidth,
          frameHeight,
          pageX,
          pageY,
        };
        this.props.onItemAction({
          layout,
          touch: e.nativeEvent,
          item: this.props.item,
        });
      }
    );
  }

  measure() {
    return this.refs.view.measure.apply(this, Array.from(arguments));
  }

  render() {
    let layout = this.props.list.layoutMap[this.props.item.index];
    let activeData = this.props.list.state.active;

    let activeIndex = activeData ? Number(activeData.item.index) : -5;
    let shouldDisplayHovering = activeIndex !== this.props.item.index;
    let Row = React.cloneElement(
      this.props.renderItem(this.props.item.data, this.props.item.index, null, this.props.active),
      {
        onLongPress: this.handleLongPress,
        onPressOut: this.props.list.cancel
      }
    );
    return (
      <View
        onLayout={this.props.onItemLayout}
        style={this.props.active && this.props.list.state.hovering ? { height: 0, opacity: 0 } : null}
        red="view">
        {
          this.props.hovering && shouldDisplayHovering ?
          this.props.activeDivider : null
        }
        {
          this.props.active &&
          this.props.list.state.hovering &&
          this.props._legacySupport ?
          null : Row
        }
      </View>
    );
  }
}

class SortItem extends Component {

  constructor(props) {
    super(props);
    let layout = this.props.list.state.active.layout;
    let wrapperLayout = this.props.list.wrapperLayout;
    this.state = {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        opacity: 0.2,
        height: layout.frameHeight,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        marginTop: layout.pageY - wrapperLayout.pageY,
      }
    };

    render() {
      const handlers = this.props.panResponder.panHandlers;
      return (
        <Animated.View
          ref="view"
          style={[
            this.state.style,
            this.props.list.state.pan.getLayout(),
          ]} >
          <View
            style={{
              opacity: 0.85,
              flex: 1,
            }} >
            {
              this.props.renderItem(
                this.props.item.data,
                this.props.item.index,
                true
              )
            }
          </View>
        </Animated.View>
      );
    }
  }
}

class SortableScrollView extends Component {
  constructor(props) {
    super(props);
    this.currentPanValue = {
      x: 0,
      y: 0,
    };
    this.state = {
      active: false,
      hovering: false,
      pan: new Animated.ValueXY(currentPanValue),
    };
    this.listener = this.state.pan.addListener(e => this.panX = e.x);
    const onPanResponderMoveCb = Animated.event([
      null,
      {
        dx: this.state.pan.x,
        dy: this.state.pan.y,
      }
    ]);
    this.state.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (e, a) => {
        const vx = Math.abs(a.vx);
        const vy = Math.abs(a.vy);
        return vx > vy;
      },
      onPanResponderMove: (evt, gestureState) => {
        gestureState.dy = 0;
        this.moveX = gestureState.moveX;
        onPanResponderMoveCb(evt, gestureState);
      },
      onPanResponderGrant: (e, gestureState) => {
        this.moved = true;
        this.state.pan.setOffset(currentPanValue);
        this.state.pan.setValue(currentPanValue);
      },
      onPanResponderRelease: (e) => {
        this.moved = false;
        if (!this.state.active) {
          if (this.state.hovering) {
            this.setState({
              hovering: false,
            });
          }
          return;
        }
        let
      }
    })
  }
}
*/
class DragAndDropTest extends Component {

  renderItems() {
    const items = [];
    for (let i = 0; i < 3; i++) {
      const item = (
        <Dragable style={styles.itemContainer}>
          <View style={styles.item}/>
        </Dragable>
      );
      items.push(item);
    }
    return items;
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.cw}
          horizontal={true}
          alwaysBounceHorizontal={false}
          showsHorizontalScrollIndicator={false} >
          {
            this.renderItems()
          }
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    paddingRight: 8,
    paddingLeft: 8,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  itemContainer: {
    overflow: 'visible',
    paddingTop: 10,
    paddingRight: 5,
    marginRight: 10,
    backgroundColor: 'pink',
  },
  item: {
    height: photoWidth,
    width: photoWidth,
    backgroundColor: 'yellow',
  },
  cw: {
    marginTop: 50,
    flexDirection: 'row',
    paddingRight: 10,
    overflow: 'visible',
  },
});

const MyComponent = require('./example');
const SortableScrollView = require('./example2');

const PHOTOS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
];
const DragReorderScrollView = require('./components/DragReorderScrollView.js');
class DummyProject extends Component {
  render() {
    return (
      <DragReorderScrollView
        items={PHOTOS} />
    );
  }
}
AppRegistry.registerComponent('DragAndDropTest', () => DummyProject);
