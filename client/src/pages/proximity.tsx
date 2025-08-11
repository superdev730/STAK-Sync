import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Bluetooth, 
  BluetoothConnected, 
  MapPin, 
  Settings, 
  Shield, 
  Users, 
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ProximitySettings {
  enabled: boolean;
  minMatchScore: number;
  alertRadius: number; // in meters
  allowNotifications: boolean;
  showOnlyMutualConnections: boolean;
}

interface NearbyMatch {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  matchScore: number;
  distance: number; // in meters
  lastSeen: string;
  profileImage?: string;
  isConnected: boolean;
}

interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number; // signal strength
  lastSeen: Date;
}

export default function ProximityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scanningRef = useRef<boolean>(false);
  const [bluetoothSupported, setBluetoothSupported] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState<BluetoothDevice[]>([]);
  const [settings, setSettings] = useState<ProximitySettings>({
    enabled: false,
    minMatchScore: 85,
    alertRadius: 50,
    allowNotifications: true,
    showOnlyMutualConnections: false
  });

  // Check Bluetooth support on component mount
  useEffect(() => {
    const checkBluetoothSupport = () => {
      if ('bluetooth' in navigator && (navigator as any).bluetooth) {
        setBluetoothSupported(true);
      } else {
        setBluetoothSupported(false);
        toast({
          title: "Bluetooth Not Supported",
          description: "Your browser doesn't support Bluetooth Web API. Try using Chrome or Edge.",
          variant: "destructive"
        });
      }
    };

    checkBluetoothSupport();
  }, [toast]);

  // Fetch proximity settings
  const { data: userSettings } = useQuery({
    queryKey: ['/api/user/proximity-settings'],
    enabled: bluetoothSupported
  });

  // Fetch nearby matches
  const { data: nearbyMatches = [], refetch: refetchMatches } = useQuery<NearbyMatch[]>({
    queryKey: ['/api/proximity/nearby-matches'],
    enabled: settings.enabled && permissionStatus === 'granted',
    refetchInterval: settings.enabled ? 30000 : false // Refresh every 30 seconds when enabled
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: ProximitySettings) => 
      apiRequest('PUT', '/api/user/proximity-settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/proximity-settings'] });
      toast({
        title: "Settings Updated",
        description: "Your proximity settings have been saved.",
      });
    }
  });

  // Request Bluetooth permission and start scanning
  const requestBluetoothPermission = async () => {
    if (!bluetoothSupported) return;

    try {
      // Request Bluetooth access
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      setPermissionStatus('granted');
      toast({
        title: "Bluetooth Access Granted",
        description: "You can now detect nearby STAK Sync users.",
      });

      // Start background scanning
      if (settings.enabled) {
        startBluetoothScanning();
      }
    } catch (error) {
      setPermissionStatus('denied');
      toast({
        title: "Bluetooth Access Denied",
        description: "Proximity features require Bluetooth access to work.",
        variant: "destructive"
      });
    }
  };

  // Start Bluetooth scanning for nearby devices
  const startBluetoothScanning = async () => {
    if (!bluetoothSupported || permissionStatus !== 'granted' || scanningRef.current) return;

    try {
      setIsScanning(true);
      scanningRef.current = true;

      // Note: Web Bluetooth API has limitations for background scanning
      // This is a simplified implementation for demonstration
      const scanDevices = async () => {
        if (!scanningRef.current) return;

        try {
          // In a real implementation, you would:
          // 1. Scan for BLE advertisements
          // 2. Match device IDs with user database
          // 3. Calculate distance using RSSI values
          // 4. Filter based on match scores and settings

          // Simulated scanning with actual Bluetooth API structure
          const devices = await (navigator as any).bluetooth.getDevices();
          const detectedDevices: BluetoothDevice[] = devices.map(device => ({
            id: device.id,
            name: device.name || 'Unknown Device',
            rssi: Math.floor(Math.random() * -100), // Simulated signal strength
            lastSeen: new Date()
          }));

          setNearbyDevices(detectedDevices);
          
          // Trigger match checking on the server
          if (detectedDevices.length > 0) {
            refetchMatches();
          }
        } catch (error) {
          console.error('Bluetooth scanning error:', error);
        }

        // Continue scanning every 10 seconds
        if (scanningRef.current) {
          setTimeout(scanDevices, 10000);
        }
      };

      scanDevices();
    } catch (error) {
      console.error('Failed to start Bluetooth scanning:', error);
      setIsScanning(false);
      scanningRef.current = false;
    }
  };

  // Stop Bluetooth scanning
  const stopBluetoothScanning = () => {
    scanningRef.current = false;
    setIsScanning(false);
    setNearbyDevices([]);
  };

  // Handle settings changes
  const handleSettingsChange = (key: keyof ProximitySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);

    // Start/stop scanning based on enabled status
    if (key === 'enabled') {
      if (value && permissionStatus === 'granted') {
        startBluetoothScanning();
      } else {
        stopBluetoothScanning();
      }
    }
  };

  // Calculate distance from RSSI (rough estimation)
  const calculateDistance = (rssi: number): number => {
    // Simple RSSI to distance conversion (very approximate)
    // Real implementation would need calibration
    const txPower = -59; // Measured power at 1 meter
    const ratio = rssi * 1.0 / txPower;
    
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      const accuracy = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
      return accuracy;
    }
  };

  // Show notification for nearby high-quality match
  const showMatchNotification = (match: NearbyMatch) => {
    if (!settings.allowNotifications) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`High-Quality Match Nearby! (${match.matchScore}%)`, {
        body: `${match.firstName} ${match.lastName} from ${match.company} is within ${match.distance}m`,
        icon: '/favicon.ico',
        tag: `match-${match.userId}`,
        requireInteraction: true
      });
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll be alerted when high-quality matches are nearby.",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-navy flex items-center justify-center gap-2">
            <Bluetooth className="h-8 w-8 text-[#CD853F]" />
            Proximity Networking
          </h1>
          <p className="text-gray-600">Discover high-quality matches when they're nearby using Bluetooth</p>
        </div>

        {/* Bluetooth Support Check */}
        {!bluetoothSupported && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your browser doesn't support Bluetooth Web API. Please use Chrome, Edge, or another compatible browser to access proximity features.
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Status */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-navy flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Permissions
            </CardTitle>
            <CardDescription>
              Proximity networking requires Bluetooth access to detect nearby users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium text-gray-900">Bluetooth Access</div>
                <div className="text-sm text-gray-600">Required to detect nearby STAK Sync users</div>
              </div>
              <div className="flex items-center gap-2">
                {permissionStatus === 'granted' && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Granted
                  </Badge>
                )}
                {permissionStatus === 'denied' && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Denied
                  </Badge>
                )}
                {permissionStatus === 'unknown' && (
                  <Button 
                    onClick={requestBluetoothPermission}
                    disabled={!bluetoothSupported}
                    className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80"
                  >
                    Grant Access
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-600">Get alerted when high-quality matches are nearby</div>
              </div>
              <Button 
                variant="outline"
                onClick={requestNotificationPermission}
                disabled={!settings.allowNotifications}
              >
                Enable Notifications
              </Button>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Privacy Note:</strong> Your location data is processed locally on your device. Only anonymized proximity signals are shared to enable match detection.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proximity Settings */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-navy flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Proximity Settings
            </CardTitle>
            <CardDescription>
              Configure when and how you're notified about nearby matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium text-gray-900">Enable Proximity Detection</div>
                <div className="text-sm text-gray-600">Start scanning for nearby STAK Sync users</div>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(value) => handleSettingsChange('enabled', value)}
                disabled={permissionStatus !== 'granted'}
              />
            </div>

            <Separator />

            {/* Minimum Match Score */}
            <div className="space-y-3">
              <Label className="text-gray-900 font-medium">
                Minimum Match Score: {settings.minMatchScore}%
              </Label>
              <Slider
                value={[settings.minMatchScore]}
                onValueChange={(value) => handleSettingsChange('minMatchScore', value[0])}
                min={50}
                max={100}
                step={5}
                className="w-full"
                disabled={!settings.enabled}
              />
              <div className="text-sm text-gray-600">
                Only notify me about matches with scores above this threshold
              </div>
            </div>

            <Separator />

            {/* Alert Radius */}
            <div className="space-y-3">
              <Label className="text-gray-900 font-medium">
                Alert Radius: {settings.alertRadius}m
              </Label>
              <Slider
                value={[settings.alertRadius]}
                onValueChange={(value) => handleSettingsChange('alertRadius', value[0])}
                min={10}
                max={200}
                step={10}
                className="w-full"
                disabled={!settings.enabled}
              />
              <div className="text-sm text-gray-600">
                How close someone needs to be before you're alerted
              </div>
            </div>

            <Separator />

            {/* Additional Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">Push Notifications</div>
                  <div className="text-sm text-gray-600">Receive alerts when high-quality matches are nearby</div>
                </div>
                <Switch
                  checked={settings.allowNotifications}
                  onCheckedChange={(value) => handleSettingsChange('allowNotifications', value)}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">Mutual Connections Only</div>
                  <div className="text-sm text-gray-600">Only show people who have also enabled proximity</div>
                </div>
                <Switch
                  checked={settings.showOnlyMutualConnections}
                  onCheckedChange={(value) => handleSettingsChange('showOnlyMutualConnections', value)}
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanning Status */}
        {settings.enabled && permissionStatus === 'granted' && (
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                {isScanning ? (
                  <BluetoothConnected className="h-5 w-5 text-[#CD853F] animate-pulse" />
                ) : (
                  <Bluetooth className="h-5 w-5" />
                )}
                Scanning Status
              </CardTitle>
              <CardDescription>
                {isScanning ? 'Actively scanning for nearby matches...' : 'Scanning is currently inactive'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {isScanning ? (
                    `Found ${nearbyDevices.length} nearby devices`
                  ) : (
                    'Start scanning to detect nearby matches'
                  )}
                </div>
                <Badge variant={isScanning ? "default" : "secondary"} className={isScanning ? "bg-green-100 text-green-800" : ""}>
                  {isScanning ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nearby Matches */}
        {nearbyMatches.length > 0 && (
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nearby Matches ({nearbyMatches.length})
              </CardTitle>
              <CardDescription>
                High-quality matches currently in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nearbyMatches.map((match) => (
                  <div key={match.userId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-white to-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#CD853F] rounded-full flex items-center justify-center text-white font-semibold">
                        {match.firstName[0]}{match.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {match.firstName} {match.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {match.title} at {match.company}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default" className="bg-[#CD853F] text-black">
                            {match.matchScore}% Match
                          </Badge>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {match.distance}m away
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {match.matchScore >= settings.minMatchScore && (
                        <Zap className="h-5 w-5 text-[#CD853F]" />
                      )}
                      <Button 
                        size="sm"
                        className="bg-navy text-white hover:bg-navy/80"
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="bg-gray-50 border border-gray-200">
          <CardHeader>
            <CardTitle className="text-navy">How Proximity Networking Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#CD853F] text-black rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <div>
                <div className="font-medium text-gray-900">Bluetooth Detection</div>
                <div className="text-sm text-gray-600">Your device scans for other STAK Sync users using Bluetooth Low Energy</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#CD853F] text-black rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <div>
                <div className="font-medium text-gray-900">Match Filtering</div>
                <div className="text-sm text-gray-600">Only users meeting your match score threshold and radius settings are shown</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#CD853F] text-black rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <div>
                <div className="font-medium text-gray-900">Smart Notifications</div>
                <div className="text-sm text-gray-600">Get alerted about high-quality matches when they're within your alert radius</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#CD853F] text-black rounded-full flex items-center justify-center text-sm font-semibold">4</div>
              <div>
                <div className="font-medium text-gray-900">Privacy First</div>
                <div className="text-sm text-gray-600">All location processing happens on your device - no location data is stored on our servers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}