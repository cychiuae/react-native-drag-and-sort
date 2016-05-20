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
  },
  itemHidden: {
    opacity: 0.0,
  }
});

const PHOTOS = [
  1,
  2,
  3,
];

class Item extends Component {

  constructor(...args) {
    super(...args);
  }

  componentDidMount() {
    this.refs.view.measure((fx, fy, width, height, px, py) => {
      console.log('Component width is: ' + width)
      console.log('Component height is: ' + height)
      console.log('X offset to frame: ' + fx)
      console.log('Y offset to frame: ' + fy)
      console.log('X offset to page: ' + px)
      console.log('Y offset to page: ' + py)
    });
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
const THRESHOLD = 200;

class Friday extends Component {

  scrollview = null;
  currentPanValue = {
    x: 0,
    y: 0,
  };
  timerId: null;
  panResponder = PanResponder.create({
    onMoveShouldSetResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: (evt, gesture) => {
      const currentItemIndex = Math.floor(
        (this.state.contentOffsetX + evt.nativeEvent.pageX) / (10 + ITEM_WIDTH)
      );
      console.log('===Yin curr item index', currentItemIndex);
     // this.state.pan.setOffset(this.currentPanValue);
      //this.state.pan.setValue(this.currentPanValue);
      this.setState({
        currentItemIndex,
        scrollEnabled: false,
      });
      this.timerId = setInterval(this.tick, INTERVAL);
    },
    onPanResponderMove: (evt, gesture) => {
      console.log('move');
      Animated.event([null, {
          dx: this.state.pan.x,
          dy: this.state.pan.y,
      }])(evt, gesture);
    },
    onPanResponderRelease: () => {
      console.log('termiate');
      clearInterval(this.timerId);
      this.setState({
        currentItemIndex: -1,
        timer: 0,
        shouldMove: false,
      });
    }
  });

  tick = () => {
    console.log('tick');
    if (this.state.timer > THRESHOLD) {
      clearInterval(this.timerId);
      console.log('long press');
      this.setState({
        shouldMove: true,
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
    };
  }

  onScroll(evt) {
    this.setState({
      contentOffset: evt.nativeEvent.contentOffset.x,
    });
  }

  renderItems() {
    const items = [];
    for (let i = 0; i < this.state.photos.length; i++) {
      const style = [];
      style.push(styles.itemWrapper);
      let panStyle = null;
      if (i === this.state.currentItemIndex && this.state.shouldMove) {
        panStyle = this.state.pan.getLayout();
        items.push(
          <Animated.View
            {...this.panResponder.panHandlers}
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
      } else {
        items.push(
          <Animated.View
            {...this.panResponder.panHandlers}
            style={panStyle} >
            <View style={style}>
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
          {...this.panResponder.panHandlers}
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
          alwaysBounceHorizontal={false}
          scrollEnabled={this.state.scrollEnabled}
          onScroll={this.onScroll}
          >
          <View style={{flexDirection: 'row'}}>
            {
              this.renderItems()
            }
            <View style={{
                position: 'absolute',
                left: this.state.currentItemIndex * (ITEM_WIDTH + 5) + 10,
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

