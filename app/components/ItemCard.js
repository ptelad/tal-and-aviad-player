import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    Text,
    TouchableNativeFeedback
} from 'react-native';

export default class ItemCard extends React.Component {
    _onPress() {
        this.props.onPress && this.props.onPress({
            title: this.props.title,
            url: this.props.url
        })
    }

    render() {
        return (
            <View style={styles.container}>
                <Image style={styles.image} source={{uri: this.props.image}}/>
                <TouchableNativeFeedback style={{flex: 1}} onPress={this._onPress.bind(this)}>
                    <View style={styles.textContainer}>
                        <Text style={styles.text}>{this.props.title}</Text>
                    </View>
                </TouchableNativeFeedback>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        height: 270,
        margin: 20,
        // borderWidth: 1,
        borderRadius: 2,
        elevation: 5,
        backgroundColor: 'white'
    },
    image: {
        flex: 0.7,
        resizeMode: 'cover',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2
    },
    textContainer: {
        flex: 0.3,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16
    }
});