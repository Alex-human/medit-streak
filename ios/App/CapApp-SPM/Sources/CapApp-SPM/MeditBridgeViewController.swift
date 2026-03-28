import Capacitor
import UIKit

@objc(MeditBridgeViewController)
public class MeditBridgeViewController: CAPBridgeViewController {
    override public func capacitorDidLoad() {
        bridge?.registerPluginType(MeditCloudStorePlugin.self)
    }
}
