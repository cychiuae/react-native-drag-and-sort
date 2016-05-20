/**
 *
 * Sortable ScrollView
 *
 * https://github.com/ocleo1
 *
 * @providesModule SortableScrollView
 *
 */
'use strict';
import React from 'react';
import ReactNative from 'react-native';
var TimerMixin = require('react-timer-mixin');

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  PanResponder,
  NativeModules,
  Animated,
} from 'react-native';

var UIManager = NativeModules.UIManager;

const LONG_PRESS_THRESHOLD = 100;
const INTERVAL = 15;
const ITEM_VIEW_HEIGHT = 89; // marginTop + marginBottom + paddingTop + paddingBottom + itemHeight + 1
const SENSITIVE_COEFFICIENT = 0.85; // bigger the coefficient, lower the move sensitive

const ITEMS = [
  'test0', 'test1', 'test2', 'test3',
  'test4', 'test5',
];
const PAN = {
  'test0': new Animated.ValueXY(),
  'test1': new Animated.ValueXY(),
  'test2': new Animated.ValueXY(),
  'test3': new Animated.ValueXY(),
  'test4': new Animated.ValueXY(),
  'test5': new Animated.ValueXY(),
};

var SortableScrollView = React.createClass({
  mixins: [TimerMixin],

  getInitialState(){
      return {
        items: [].concat(ITEMS), // Clone
        pan: {...PAN},
        newIndex: -1,
        contentOffsetX: 0,
        scrollViewTop: 0,
        timer: 0,
        moveable: false,
        shouldScroll: true,
      }
  },

  componentWillMount(){
    var self = this;
    this._itemWrapperResponder = {
      onStartShouldSetResponder: ()=> false,
      onMoveShouldSetResponder: ()=> true,
      onResponderGrant: ()=>{ console.log('wrapper grant') },
      onResponderMove: ()=>{ console.log('wrapper move') },
      onResponderRelease: ()=>{ console.log('wrapper release') },
      onResponderTerminationRequest: ()=>{ console.log('wrapper termination request') },
      onResponderTerminate: ()=>{ console.log('wrapper terminate') }
    },
    this._itemPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: ()=> {
        return true;
      },
      onPanResponderGrant: (evt, gs)=>{
        console.log('item grant');
        self.state.currentItemIndex = Math.floor((self.state.contentOffsetX + evt.nativeEvent.pageX - self.state.scrollViewTop) / ITEM_VIEW_HEIGHT);
        console.log(self.state.currentItemIndex);
        self.timerId = self.setInterval(self._tikTok, INTERVAL);
      },
      onPanResponderMove: (evt, gs)=>{

        if (!self.state.moveable) return;

        console.log('item move');
        self.state.shouldScroll = false;
        console.log('item move index', self.state.newIndex);

        // extract current item from item list
        const currentItem = self.state.items.splice(self.state.newIndex, 1);
        // if (gs.dx % 3 > 0.123 || -gs.dx % 3 > 0.123) {
        //   Animated.event([
        //     null,
        //     {
        //       dx: this.state.pan[currentItem].x,
        //     }
        //   ])(evt, gs);
        // }
        // gs.dy > 0, Move down
        // gs.dy < 0, Move up
        // gs.dy == 0, no change
        let movedPosition = gs.dx / (ITEM_VIEW_HEIGHT * SENSITIVE_COEFFICIENT);
        movedPosition = gs.dx < 0 ? Math.ceil(movedPosition) : Math.floor(movedPosition);
        console.log('movedPosition', movedPosition);
        if (movedPosition != 0) {
          Animated.spring(
            this.state.pan[currentItem],
            {
              toValue: {
                x: 0,
                y: 0,
              }
            }
          ).start();
          gs.dx = 0;
        }
        self.state.newIndex = self.state.currentItemIndex + movedPosition;
        //self.state.currentItemIndex = self.state.newIndex;
        // insert item to new position
        self.state.items.splice(self.state.newIndex, 0, currentItem);
        self.setState(self.state);
      },
      onPanResponderRelease: (evt, gs)=>{
        console.log('item release');
        self.clearInterval(self.timerId);
        self.state.timer = 0;
        self.state.moveable = false;
        for (let i = 0; i < 6; i++) {
          Animated.spring(
            this.state.pan[self.state.items[i]],
            {
              toValue: {
                x: 0,
                y: 0,
              }
            }
          ).start();
        }

        delete self.state.newIndex; // reset background color
        self.state.shouldScroll = true;
        self.setState(self.state);
      },
      onPanResponderTerminationRequest: ()=>{
        console.log('item termination request');
        if (self.state.timer < LONG_PRESS_THRESHOLD) {
          return true;
        }
        return false;
      },
      onPanResponderTerminate: ()=>{
        console.log('item terminate');
        self.clearInterval(self.timerId);
        self.state.timer = 0;
        self.state.moveable = false;
        self.state.shouldScroll = true;
        delete self.state.newIndex; // reset background color
        self.setState(self.state);
      }
    })
  },

  componentDidMount() {
    var self = this;
    var scrollViewHandle = ReactNative.findNodeHandle(this.refs.scrollView);
    // measure scroll view component top value
    UIManager.measure(scrollViewHandle, (frameX, frameY, width, height, pageX, pageY) => {
      self.state.scrollViewTop = pageX;
    });
  },

  _tikTok() {
    if (this.state.timer >= LONG_PRESS_THRESHOLD) {
      console.log('long press');
      this.clearInterval(this.timerId);
      this.state.moveable = true;
      // in order to set background color to current item
      this.state.newIndex = this.state.currentItemIndex;
    } else {
      this.state.timer += INTERVAL;
    }
    this.setState(this.state);
  },

  _onScroll(e) {
    this.state.contentOffsetX = e.nativeEvent.contentOffset.x;
  },

  render() {
    return (
      <View style={styles.container}>
        <ScrollView
          ref="scrollView"
          horizontal={true}
          scrollEnabled={this.state.shouldScroll}
          style={styles.scrollView}
          alwaysBounceHorizontal={false}
          onScroll={this._onScroll}
          scrollEventThrottle={200} >
            {
              this.state.items.map((item, i) => {
                var backgroundColor;
                if (this.state.newIndex == i) {
                  backgroundColor = 'red';
                } else {
                  backgroundColor = '#eaeaea';
                }
                return (
                  <Animated.View
                    {...this._itemPanResponder.panHandlers}
                    style={this.state.pan[item].getLayout()}>
                    <View
                      style={[styles.itemView, {"backgroundColor": backgroundColor}]}
                      key={i}>
                    <Text style={styles.text}>{item}</Text>
                    </View>
                  </Animated.View>
                );
              })
            }
        </ScrollView>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    marginTop: 50,
  },
  scrollView: {
    height: 300,
    flexDirection: 'row',
  },
  itemViewWrapper: {
    // ...
  },
  itemView: {
    margin: 7,
    padding: 5,
    borderRadius: 3,
  },
  text: {
    width: 64,
    height: 64
  }
});

module.exports = SortableScrollView;