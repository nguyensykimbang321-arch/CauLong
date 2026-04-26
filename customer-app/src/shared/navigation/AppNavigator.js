import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../../booking/screens/HomeScreen';
import BookingScreen from '../../booking/screens/BookingScreen';
import MyBookingsScreen from '../../booking/screens/MyBookingsScreen';
import BookingDetailScreen from '../../booking/screens/BookingDetailScreen';
import BookingConfirmScreen from '../../booking/screens/BookingConfirmScreen';
import QRCheckinScreen from '../../booking/screens/QRCheckinScreen';

import ShopScreen from '../../shop/screens/ShopScreen';
import ProductDetailScreen from '../../shop/screens/ProductDetailScreen';
import CartScreen from '../../shop/screens/CartScreen';
import CheckoutScreen from '../../shop/screens/CheckoutScreen';

import AccountScreen from '../../account/screens/AccountScreen';
import NotificationsScreen from '../../account/screens/NotificationsScreen';

const Tab = createBottomTabNavigator();

const HomeStack = createStackNavigator();
const BookingStack = createStackNavigator();
const ShopStack = createStackNavigator();
const AccountStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="QRCheckin" component={QRCheckinScreen} />
    </HomeStack.Navigator>
  );
}

function BookingStackScreen() {
  return (
    <BookingStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingStack.Screen name="Booking" component={BookingScreen} />
      <BookingStack.Screen name="MyBookings" component={MyBookingsScreen} />
      <BookingStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <BookingStack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
    </BookingStack.Navigator>
  );
}

function ShopStackScreen() {
  return (
    <ShopStack.Navigator screenOptions={{ headerShown: false }}>
      <ShopStack.Screen name="Shop" component={ShopScreen} />
      <ShopStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <ShopStack.Screen name="Cart" component={CartScreen} />
      <ShopStack.Screen name="Checkout" component={CheckoutScreen} />
    </ShopStack.Navigator>
  );
}

function AccountStackScreen() {
  return (
    <AccountStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountStack.Screen name="Account" component={AccountScreen} />
      <AccountStack.Screen name="Notifications" component={NotificationsScreen} />
      <AccountStack.Screen name="MyBookings" component={MyBookingsScreen} />
      <AccountStack.Screen name="BookingDetail" component={BookingDetailScreen} />
    </AccountStack.Navigator>
  );
}

const TABS = [
  { name: 'HomeTab', component: HomeStackScreen, icon: 'home', label: 'Trang chủ' },
  { name: 'BookingTab', component: BookingStackScreen, icon: 'tennisball', label: 'Đặt sân' },
  { name: 'ShopTab', component: ShopStackScreen, icon: 'cart', label: 'Cửa hàng' },
  { name: 'AccountTab', component: AccountStackScreen, icon: 'person-circle', label: 'Tài khoản' },
];

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: '#E6ECF5',
          height: tabBarHeight,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
        tabBarIcon: ({ focused, color, size }) => {
          const config = TABS.find((t) => t.name === route.name);
          const iconName = focused ? config.icon : `${config.icon}-outline`;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarLabel: tab.label }}
        />
      ))}
    </Tab.Navigator>
  );
}

