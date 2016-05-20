import React, {
  Component,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';

class Item extends Component {
  render() {
    return (
      <View style={this.props.style}>
        { this.props.children }
      </View>
    );
  }
}

function reorderKeys(obj, f) {
  var newKeys = f(Object.keys(obj));
  var ret = {};
  for (var i = 0; i < newKeys.length; i++) {
    var key = newKeys[i];
    ret[key] = obj[key];
  }
  return ret;
}

class List extends Component {
  constructor(props) {
    super(props);
    const { items } = props;
    return {
      layouts: {},
      items,
      movingItemKey: null,
      movingX: null,
      scrollEnabled: true,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { items } = nextProps;
    this.setState({
      items,
    });
  }

  handleItemLayout(key, e) {
    const { layout } = e.nativeEvent;
    const { layouts } = this.state;
    this.setState(({layouts}) => {
      return {
        layouts: {
          ...layouts,
          [key]: layout,
        }
      }
    })
  }

  reorderItemsOnMove(e) {
    const {
      movingItemKey,
      items,
    } = this.state;

    if (movingItemKey == null) {
      return;
    }

    let rowKey = this.findKeyOfItem(e);

    if (rowKey == null) {
      let keys = Objects.keys(items);
      rowKey = keys[keys.length - 1];
    }

    if (rowKey !== movingItemKey) {
      this.setState({
        items: reorderKeys(this.state.items,keys => {
          let a, b;
          keys.forEach((key,i) => {
            if(key == rowKey) {
              a = i
            }

            if(key == movingItemKey) {
              b = i
            }
          });

          const tmp = keys[a];
          keys[a] = keys[b];
          keys[b] = tmp;
          return keys;
        }),
      });
    }
  }

  findKeyOfItem(e) {
    const contentX = this.extractContentX(e);
    const {
      items,
      layouts,
    } = this.state;

    let curWidth = 0;
    let rowKey = null;
    let keys = Objects.keys(items);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const layout = layouts[key];
      curWidth = curWidth + layout.width;
      if (contentX < curWidth) {
        rowKey = key;
        break;
      }
    }

    return rowKey;
  }

  onMoveShouldSetResponder() {
    return true;
  }

  extractContentX(e) {
    const { pageX } = e.nativeEvent;
    const { contentOffset } = this.state;
    const contentX = pageX + contentOffset.x;
    return contentX;
  }

  onResponderGrant(e) {
    const rowKey = this.findKeyOfItem(e);
    const contentX = this.extractContentX(e);
    this.longpressSelectTimer = setTimeout(() => {
      this.setState({
        movingItemKey: rowKey,
        movingX: contentX,
        scrollEnabled: false,
      });
    }, 500);
  }

  onResponderMove(e) {
    const { pageX } = e.nativeEvent;
    this.setState({
      movingX: this.extractContentX(e),
    });

    this.reorderItemsOnMove(e);

    if (pageX >= 60 && this._autoScrollingInterval != null) {
      clearInterval(this._autoScrollingInterval);
      this._autoScrollingInterval = null;
    }

    if (pageX < 60 && this._autoScrollingInterval == null) {
      let counter = 0;
      this._autoScrollingInterval = setInterval(() => {
        counter++;
        if (this.state.contentOffset.x > 0) {
          let dx;
          if (counter > 3) {
            dx = 60;
          } else {
            dx = 30;
          }

          this.scrollBy(-dx);
        }
      }, 100);
    }

    if (pageX > 500 && this._autoScrollingInterval == null) {
      let counter = 0;
      this._autoScrollingInterval = setInterval(() => {
        counter++;
        // console.log(this.state.contentOffset);
        // 675 is the screen height
        if(this.state.contentOffset.x < (this._contentWidth - 675)) {
          let dx;
          if(counter > 3) {
            dx = 60;
          } else {
            dx = 30;
          }
          this.scrollBy(dx);
        }
      }, 100);
    }
  }

  onResponderRelease(e) {
    this.resetMovingItem();
  }



}





